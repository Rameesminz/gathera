import { AppShell } from '@/components/common/app-shell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">App preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Switch between light and dark mode</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API</CardTitle>
            <CardDescription>Backend connection</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              API URL:{' '}
              <code className="rounded bg-muted px-2 py-1 text-foreground">
                {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8788/api/v1'}
              </code>
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
