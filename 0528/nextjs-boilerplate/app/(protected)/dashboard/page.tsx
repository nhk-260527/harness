// app/(protected)/dashboard/page.tsx
import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { name, email, image } = session.user

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-background border-b px-6 py-3 flex justify-between items-center">
        <span className="font-semibold">My App</span>
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={image ?? ""} alt={name ?? "User"} />
              <AvatarFallback>{name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/login" })
                }}
              >
                <button type="submit" className="w-full text-left cursor-pointer">
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="p-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{email}</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
