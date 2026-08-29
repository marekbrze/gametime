import { Link } from 'react-router-dom';
import { LEAGUE_BY_ID } from '@/modules/data-source/data/catalog';

interface LeagueLinkProps {
  leagueId: string;
  /** styl kontekstu — rozmiar/kolor dziedziczony z wiersza, karty, dialogu */
  className?: string;
  /** w kontekście dialogu: zamknięcie przed nawigacją (idiom linków uczestników) */
  onClick?: () => void;
}

/**
 * Nazwa ligi jako link do jej ekranu (nawigacja ADR-0020, decyzja ADR-0035).
 * Id poza katalogiem → zwykły tekst: link do gwarantowanego not-found nie
 * ląduje w UI (ta sama zasada co „Unknown team", ADR-0024).
 */
export function LeagueLink({ leagueId, className, onClick }: LeagueLinkProps) {
  const league = LEAGUE_BY_ID.get(leagueId);
  const name = league?.name ?? leagueId;
  if (!league) return <span className={className}>{name}</span>;
  return (
    <Link
      to={`/teams/league/${league.id}`}
      onClick={onClick}
      className={`underline-offset-2 hover:underline focus-visible:underline ${className ?? ''}`}
    >
      {name}
    </Link>
  );
}
