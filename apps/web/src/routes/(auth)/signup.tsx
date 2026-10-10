import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import type { AuthCredentials } from "@takobox/sdk";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import * as Field from "@/components/primitives/Field";
import { Input } from "@/components/primitives/Input";
import { registerOptions } from "@/queries/register";
import { settingsOptions } from "@/queries/settings";
import { formatError } from "@/utils/error";

export const Route = createFileRoute("/(auth)/signup")({
  component: SignUp,
});

function SignUp() {
  const { data: settings } = useQuery(settingsOptions);
  const { register, handleSubmit } = useForm<AuthCredentials>();
  const navigate = useNavigate();
  const { mutateAsync: registerMutation, error } = useMutation(registerOptions);

  const accountCreationDisabled = !!settings && !settings.enableAccountCreation;

  const onSubmit = async (values: AuthCredentials) => {
    await registerMutation(values);
    await navigate({ to: "/" });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-xs flex-col gap-6">
      <h1 className="text-2xl">Create account</h1>
      <Field.Group>
        {accountCreationDisabled && (
          <Alert variant="info">Account creation is currently disabled for this instance.</Alert>
        )}
        {error && <Alert>{formatError(error)}</Alert>}
        <Field.Root>
          <Field.Label>Username</Field.Label>
          <Input
            {...register("username", { required: true })}
            type="text"
            placeholder="Username"
            disabled={accountCreationDisabled}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Password</Field.Label>
          <Input
            {...register("password", { required: true })}
            type="password"
            placeholder="Password"
            disabled={accountCreationDisabled}
          />
        </Field.Root>
      </Field.Group>
      <Button type="submit" disabled={accountCreationDisabled}>
        Create account
      </Button>
      <span className="text-center text-muted-foreground">
        Already have an account?{" "}
        <Link className="text-foreground hover:underline" to="/login">
          Log in
        </Link>
      </span>
    </form>
  );
}
