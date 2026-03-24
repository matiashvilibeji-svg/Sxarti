import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Extract text from a DOCX file buffer.
 * DOCX is a ZIP containing word/document.xml — we strip XML tags to get plain text.
 */
async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = zip.file("word/document.xml");
  if (!docXml) throw new Error("Invalid DOCX: missing word/document.xml");

  const xml = await docXml.async("string");

  // Replace paragraph/line-break tags with newlines, then strip all XML tags
  const text = xml
    .replace(/<w:p[^>]*>/g, "\n")
    .replace(/<w:br[^>]*>/g, "\n")
    .replace(/<w:tab[^>]*>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

/**
 * Extract text from a PDF using Gemini vision.
 * This is reliable for Georgian text and handles scanned PDFs too.
 */
async function extractPdfTextWithGemini(
  buffer: ArrayBuffer,
  geminiKey: string,
): Promise<string> {
  const base64 = btoa(
    new Uint8Array(buffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      "",
    ),
  );

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: "application/pdf",
                  data: base64,
                },
              },
              {
                text: "Extract ALL text content from this PDF document. Return ONLY the extracted text, preserving the original structure and language. Do not add any commentary or explanation.",
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini PDF extraction failed: ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { document_id } = await req.json();

    if (!document_id) {
      return new Response(
        JSON.stringify({ error: "document_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch document record
    const { data: doc, error: docError } = await supabase
      .from("knowledge_documents")
      .select("*")
      .eq("id", document_id)
      .single();

    if (docError || !doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("knowledge-documents")
      .download(doc.file_path);

    if (downloadError || !fileData) {
      await supabase
        .from("knowledge_documents")
        .update({ status: "error" })
        .eq("id", document_id);

      return new Response(
        JSON.stringify({ error: "Failed to download file from storage" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let extractedText = "";

    try {
      const buffer = await fileData.arrayBuffer();

      switch (doc.file_type) {
        case "txt": {
          extractedText = new TextDecoder("utf-8").decode(buffer);
          break;
        }
        case "docx": {
          extractedText = await extractDocxText(buffer);
          break;
        }
        case "pdf": {
          const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
          if (!geminiKey) {
            throw new Error("GOOGLE_GEMINI_API_KEY not configured");
          }
          extractedText = await extractPdfTextWithGemini(buffer, geminiKey);
          break;
        }
        default:
          throw new Error(`Unsupported file type: ${doc.file_type}`);
      }
    } catch (extractError) {
      console.error("Text extraction error:", extractError);
      await supabase
        .from("knowledge_documents")
        .update({ status: "error" })
        .eq("id", document_id);

      return new Response(
        JSON.stringify({
          error: `Extraction failed: ${extractError instanceof Error ? extractError.message : String(extractError)}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Truncate to ~50k chars to avoid bloating the system prompt
    const maxChars = 50_000;
    if (extractedText.length > maxChars) {
      extractedText = extractedText.slice(0, maxChars) + "\n\n[... შეკვეცილია]";
    }

    // Update the document record
    const { error: updateError } = await supabase
      .from("knowledge_documents")
      .update({
        extracted_text: extractedText,
        status: "ready",
      })
      .eq("id", document_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update document record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        chars_extracted: extractedText.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
