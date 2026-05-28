import ProfileClient from '@/components/ProfileClient';

export default async function MemberPage({ params }) {
  const { member } = await params;
  return <ProfileClient memberSlug={member} />;
}
