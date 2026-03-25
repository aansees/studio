import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyPage } from "@/components/global/pages/404";
import Image from "next/image";

export function Unauthorized() {
  return (
    <EmptyPage
      media={<Image src={"/alert.png"} alt="Alert" height={500} width={500} />}
      title="401 Unauthorized"
      description={
        <>
          You do not have permission to view this page. Please sign in with an
          authorized account or return to the dashboard.
        </>
      }
      actions={
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      }
    />
  );
}
