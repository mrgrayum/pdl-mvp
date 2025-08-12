export default function Rules() {
  return (
    <div className="prose max-w-none">
      <h1>Rules (Prototype Summary)</h1>
      <ul>
        <li>Pick 3 MPO + 3 FPO: one each Pop / Drop / Lock.</li>
        <li>Pop/Drop players must have ≥3 events + an average set; Lock can be any player.</li>
        <li>Lock usage: same player at most 5 times per season.</li>
        <li>Picks close at the event lock time (seed uses 24h from creation).</li>
        <li>Scoring: Pop = avg - finish; Drop = finish - avg; Lock: 25/10/5/0 per finish tiers; DNF: Pop 0, Drop +10.</li>
      </ul>
    </div>
  );
}
