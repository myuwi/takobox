import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { Input } from "@/components/primitives/Input";
import { Label } from "@/components/primitives/Label";
import { useLoginMutation } from "@/queries/login";
import type { AuthPayload } from "@/types/AuthPayload";
import { formatError } from "@/utils/error";

export const Route = createFileRoute("/(auth)/login")({
  component: Login,
});

function Login() {
  const { register, handleSubmit } = useForm<AuthPayload>();
  const navigate = useNavigate();
  const { mutateAsync: loginMutation, error } = useLoginMutation();

  const onSubmit = async (values: AuthPayload) => {
    await loginMutation(values);
    await navigate({ to: "/" });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-xs flex-col gap-6"
    >
      <h1 className="text-2xl">Log in</h1>
      <div className="flex flex-col gap-4">
        {error && <Alert>{formatError(error)}</Alert>}
        <Label className="flex flex-col gap-2">
          Username
          <Input
            {...register("username", { required: true })}
            type="text"
            placeholder="Username"
          />
        </Label>
        <Label className="flex flex-col gap-2">
          Password
          <Input
            {...register("password", { required: true })}
            type="password"
            placeholder="Password"
          />
        </Label>
      </div>
      <Button type="submit">Log in</Button>
      <span className="text-center text-zinc-500">
        Don't have an account yet?{" "}
        <Link className="text-zinc-700 hover:underline" to="/signup">
          Create account
        </Link>
      </span>
    </form>
  );
}
