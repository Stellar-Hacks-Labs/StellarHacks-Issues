import { SKILL_CATALOG } from "../../../../lib/team-board";

export function SkillFilter({ slug, selected }: { slug: string; selected: string | null }) {
  return (
    <nav aria-label="Skills">
      <a href={`/hackathons/${slug}/team-board`}>All</a>
      {SKILL_CATALOG.map((skill) => (
        <a key={skill} href={`/hackathons/${slug}/team-board?skill=${skill}`} aria-current={selected === skill ? "true" : undefined}>{skill}</a>
      ))}
    </nav>
  );
}
