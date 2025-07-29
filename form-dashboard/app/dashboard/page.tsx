import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <Button asChild>
        <Link href="/login">Log out</Link>
      </Button>
    </div>
  )
}
