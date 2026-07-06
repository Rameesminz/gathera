import { AppShell } from '@/components/common/app-shell';
import { CreateClubForm } from '@/components/forms/create-club-form';

export const metadata = { title: 'New club' };

export default function NewClubPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create a club</h1>
          <p className="text-muted-foreground">Start a new community on Gathera</p>
        </div>
        <CreateClubForm />
      </div>
    </AppShell>
  );
}
