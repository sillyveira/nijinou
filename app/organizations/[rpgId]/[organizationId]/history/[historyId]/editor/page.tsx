'use client';

import ChapterEditor from '@/app/components/ChapterEditor';
import { useParams } from 'next/navigation';

export default function OrganizationHistoryEditorPage() {
  const params = useParams();
  const rpgId = params?.rpgId as string;
  const organizationId = params?.organizationId as string;
  const historyId = params?.historyId as string;

  return (
    <ChapterEditor
      rpgId={rpgId}
      parentId={organizationId}
      parentType="organization"
      historyId={historyId}
      backUrl={`/organizations/${rpgId}/${organizationId}`}
    />
  );
}
