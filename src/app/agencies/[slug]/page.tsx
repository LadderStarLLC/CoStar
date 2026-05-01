import { redirect } from "next/navigation";

export default function LegacyAgencyProfileRedirect({ params }: { params: { slug: string } }) {
  redirect(`/agency/${params.slug}`);
}
