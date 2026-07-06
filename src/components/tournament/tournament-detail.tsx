'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { addTeam, fetchTournament, generateFixtures } from '@/lib/api/tournaments';
import { getApiErrorMessage } from '@/lib/api/client';

export function TournamentDetail({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchTournament>> | null>(null);
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    fetchTournament(tournamentId)
      .then(setData)
      .catch((err) => setError(getApiErrorMessage(err)));
  };

  useEffect(() => {
    load();
  }, [tournamentId]);

  const handleAddTeam = async () => {
    if (!teamName.trim()) return;
    setLoading(true);
    try {
      await addTeam(tournamentId, teamName.trim());
      setTeamName('');
      load();
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateFixtures(tournamentId);
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!data) return <p className="text-muted-foreground">Loading tournament...</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link href=".." className="text-sm text-primary hover:underline">
          ← Back to tournaments
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{String(data.tournament.name)}</h1>
        <p className="text-muted-foreground">Status: {String(data.tournament.status)}</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Teams ({data.teams.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <Button onClick={() => void handleAddTeam()} disabled={loading}>
              Add
            </Button>
          </div>
          <ul className="space-y-1 text-sm">
            {data.teams.map((t) => (
              <li key={String(t.id)}>{String(t.name)}</li>
            ))}
          </ul>
          {data.teams.length >= 2 && data.matches.length === 0 ? (
            <Button variant="outline" onClick={() => void handleGenerate()} disabled={loading}>
              Generate fixtures
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {data.matches.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Matches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.matches.map((m) => (
              <div key={String(m.id)} className="rounded border border-border p-2">
                Round {String(m.round)}: {String(m.team1_name ?? 'TBD')} vs{' '}
                {String(m.team2_name ?? 'TBD')} — {String(m.status)}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {data.leaderboard.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {data.leaderboard.map((row) => (
                <li key={String(row.id)}>
                  {String(row.name)} — {String(row.wins)} wins
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
