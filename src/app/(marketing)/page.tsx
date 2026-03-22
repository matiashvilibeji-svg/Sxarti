import Link from "next/link";
import {
  Bot,
  MessageSquare,
  BarChart3,
  Bell,
  Check,
  Zap,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Bot,
    title: "AI გაყიდვების ბოტი",
    description:
      "ხელოვნური ინტელექტი, რომელიც ქართულ ენაზე ეხმარება მომხმარებლებს პროდუქციის არჩევასა და შეკვეთაში.",
  },
  {
    icon: MessageSquare,
    title: "მულტი-პლატფორმა",
    description:
      "Facebook Messenger, Instagram Direct — ერთი პანელიდან მართავ ყველა საუბარს.",
  },
  {
    icon: BarChart3,
    title: "ანალიტიკა",
    description:
      "რეალურ დროში აკონტროლე გაყიდვები, საუბრები და მომხმარებლის ქცევა.",
  },
  {
    icon: Bell,
    title: "შეტყობინებები",
    description:
      "მიიღე ახალი შეკვეთების და მნიშვნელოვანი მოვლენების შეტყობინებები WhatsApp-ში ან Telegram-ში.",
  },
];

const plans = [
  {
    name: "Starter",
    price: 79,
    description: "მცირე ბიზნესისთვის",
    features: [
      "AI ბოტი 1 პლატფორმაზე",
      "500 საუბარი/თვეში",
      "ძირითადი ანალიტიკა",
      "ელ-ფოსტის მხარდაჭერა",
    ],
    cta: "უფასოდ დაიწყე",
    popular: false,
  },
  {
    name: "Business",
    price: 149,
    description: "მზარდი ბიზნესისთვის",
    features: [
      "AI ბოტი ყველა პლატფორმაზე",
      "2000 საუბარი/თვეში",
      "Google Sheets სინქრონიზაცია",
      "WhatsApp/Telegram შეტყობინებები",
      "პრიორიტეტული მხარდაჭერა",
    ],
    cta: "უფასოდ დაიწყე",
    popular: true,
  },
  {
    name: "Premium",
    price: 299,
    description: "დიდი ბიზნესისთვის",
    features: [
      "ყველაფერი Business-ში",
      "ულიმიტო საუბრები",
      "საკუთარი AI პერსონაჟი",
      "API წვდომა",
      "გამოყოფილი მენეჯერი",
    ],
    cta: "დაგვიკავშირდი",
    popular: false,
  },
];

const testimonials = [
  {
    name: "ნინო კ.",
    role: "ონლაინ მაღაზიის მფლობელი",
    text: "სხარტიმ ჩემს მაღაზიას გაყიდვები 40%-ით გაუზარდა. ბოტი ღამითაც მუშაობს და არცერთ შეკვეთას არ აცდენს.",
  },
  {
    name: "გიორგი მ.",
    role: "კაფე-ბარის მფლობელი",
    text: "ადრე ყოველ შეტყობინებას ხელით ვპასუხობდი. ახლა ბოტი ყველაფერს აკეთებს, მე მხოლოდ შეკვეთებს ვამოწმებ.",
  },
  {
    name: "მარიამ თ.",
    role: "ჰენდმეიდ ბიზნესი",
    text: "ინსტაგრამიდან შემოსული შეკვეთები გაორმაგდა. მომხმარებლებს უყვართ რომ მაშინვე იღებენ პასუხს.",
  },
];

export default function MarketingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="flex flex-col items-center px-6 pb-20 pt-16 text-center">
        <Badge variant="secondary" className="mb-6">
          AI გაყიდვების ასისტენტი
        </Badge>
        <h1 className="max-w-3xl text-4xl font-bold tracking-display text-on-surface sm:text-5xl lg:text-6xl">
          შენი გაყიდვები
          <br />
          <span className="bg-gradient-cta bg-clip-text text-transparent">
            არასდროს იძინებს
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-on-surface-variant">
          სხარტი — ქართული AI ბოტი, რომელიც 24/7 პასუხობს მომხმარებლებს, იღებს
          შეკვეთებს და ზრდის შენს გაყიდვებს.
        </p>
        <div className="mt-8 flex gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">
              უფასოდ დაიწყე
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="#features">გაიგე მეტი</Link>
          </Button>
        </div>
        <div className="mt-12 flex items-center gap-8 text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-secondary" />
            <span>14 დღე უფასოდ</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span>5 წუთში დაიწყე</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-surface-container-low px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-display text-on-surface">
            ყველაფერი რაც გჭირდება
          </h2>
          <p className="mb-12 text-center text-on-surface-variant">
            ერთი პლატფორმა — AI ბოტი, ანალიტიკა, შეტყობინებები და სრული
            კონტროლი.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-on-surface">
                  {feature.title}
                </h3>
                <p className="text-sm text-on-surface-variant">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-display text-on-surface">
            ფასები
          </h2>
          <p className="mb-12 text-center text-on-surface-variant">
            აირჩიე შენთვის შესაფერისი გეგმა. ყველა გეგმას აქვს 14 დღიანი უფასო
            საცდელი პერიოდი.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`flex flex-col ${plan.popular ? "relative ring-2 ring-primary" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>პოპულარული</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-on-surface">
                      {plan.price}
                    </span>
                    <span className="text-on-surface-variant"> ₾/თვე</span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-on-surface-variant"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/signup">{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface-container-low px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-display text-on-surface">
            რას ამბობენ ჩვენი მომხმარებლები
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="p-6">
                <p className="mb-4 text-sm text-on-surface-variant">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-on-surface">{t.name}</p>
                  <p className="text-xs text-on-surface-variant">{t.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-display text-on-surface">
          მზად ხარ გაყიდვების გასაზრდელად?
        </h2>
        <p className="mb-8 text-on-surface-variant">
          დაიწყე უფასოდ 14 დღით — საკრედიტო ბარათი არ საჭიროებს.
        </p>
        <Button size="lg" asChild>
          <Link href="/signup">
            უფასოდ დაიწყე
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </main>
  );
}
