import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { Input } from "@/components/primitives/Input";
import { Label } from "@/components/primitives/Label";
import { registerOptions } from "@/queries/register";
import { settingsOptions } from "@/queries/settings";
import type { AuthPayload } from "@/types";
import { formatError } from "@/utils/error";

export const Route = createFileRoute("/(auth)/signup")({
  component: SignUp,
});

function SignUp() {
  const { data: settings } = useQuery(settingsOptions);
  const { register, handleSubmit } = useForm<AuthPayload>();
  const navigate = useNavigate();
  const { mutateAsync: registerMutation, error } = useMutation(registerOptions);

  if (!settings?.enableAccountCreation) {
    return (
      <div className="flex max-w-xs flex-col gap-6">
        <Lock size={64} className="mx-auto opacity-60" />
        <Alert>
          <div className="flex flex-col items-start gap-2">
            <p>Account creation is currently disabled for this instance.</p>
            <Link className="not-hover:underline" to="/login">
              Log in instead
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  const onSubmit = async (values: AuthPayload) => {
    await registerMutation(values);
    await navigate({ to: "/" });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-xs flex-col gap-6">
      <h1 className="text-2xl">Create account</h1>
      <div className="flex flex-col gap-4">
        {error && <Alert>{formatError(error)}</Alert>}
        <Label className="flex flex-col gap-2">
          Username
          <Input {...register("username", { required: true })} type="text" placeholder="Username" />
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
      <Button type="submit">Create account</Button>
      <span className="text-center text-zinc-500">
        Already have an account?{" "}
        <Link className="text-zinc-700 hover:underline" to="/login">
          Log in
        </Link>
      </span>
    </form>
  );
}
