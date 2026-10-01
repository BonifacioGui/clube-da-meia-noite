import { ReadingApp } from "@/app/page";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ReadingApp inviteToken={token} />;
}
