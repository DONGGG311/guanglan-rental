import type { Metadata } from "next";
import SpaceDetailContent from "./SpaceDetailContent";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SpaceDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SpaceDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const spaceId = Number(id);

  if (isNaN(spaceId)) {
    return { title: "厂房详情" };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/spaces/${spaceId}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return { title: "厂房详情" };
    }

    const space = await res.json();

    const title = space.name || "厂房详情";
    const description = [
      `${space.name}`,
      space.area ? `${space.area}㎡` : "",
      "印刷包装厂房",
      space.address || "",
      space.monthly_rent ? `月租${space.monthly_rent}元` : "",
      space.yearly_rent ? `年租${space.yearly_rent}元` : "",
      "参数透明，专业配套",
    ]
      .filter(Boolean)
      .join("，");

    return {
      title,
      description,
    };
  } catch {
    return { title: "厂房详情" };
  }
}

export default async function SpaceDetailPage({
  params,
}: SpaceDetailPageProps) {
  const { id } = await params;
  const spaceId = Number(id);

  return <SpaceDetailContent spaceId={spaceId} />;
}
