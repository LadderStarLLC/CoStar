import { redirect } from "next/navigation";

export default function LegacyTalentProfileRedirect({ params }: { params: { slug: string } }) {
  redirect(`/talent/${params.slug}`);
}
