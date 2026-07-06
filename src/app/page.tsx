import Link from 'next/link';
import { ArrowRight, Calendar, MessageSquare, Users, Vote } from 'lucide-react';
import { Header } from '@/components/common/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Users,
    title: 'Clubs',
    description: 'Create and manage communities with roles and permissions.',
  },
  {
    icon: Calendar,
    title: 'Events',
    description: 'Schedule meetups and track RSVPs in one place.',
  },
  {
    icon: Vote,
    title: 'Polls',
    description: 'Make group decisions quickly with live voting.',
  },
  {
    icon: MessageSquare,
    title: 'Chat',
    description: 'Real-time group and direct messaging for your club.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <Header />
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
            Community platform
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Gather your people. Build your club.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Gathera brings clubs, events, polls, and chat together — on web and mobile, online or
            offline.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground shadow-sm hover:opacity-90"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-lg px-6 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
