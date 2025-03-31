import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";

export const Route = createFileRoute("/(auth)/login")({
  component: Login,
});

function Login() {
  return (
    <form className="flex w-full max-w-xs flex-col gap-6" method="post">
      <h1 className="text-2xl">Log in</h1>
      <div className="flex flex-col gap-4">
        <Label className="flex flex-col gap-2">
          Username
          <Input
            className="input"
            type="text"
            name="username"
            placeholder="Username"
            required
          />
        </Label>
        <Label className="flex flex-col gap-2">
          Password
          <Input
            className="input"
            type="password"
            name="password"
            placeholder="Password"
            required
          />
        </Label>
      </div>
      <Button type="submit">Log in</Button>
      <span className="text-center text-zinc-500">
        Don't have an account yet?{" "}
        <Link className="text-zinc-700 hover:underline" to="/sign-up">
          Create account
        </Link>
      </span>
    </form>
  );
}
