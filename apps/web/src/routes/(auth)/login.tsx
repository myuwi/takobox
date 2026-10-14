import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import type { AuthCredentials } from "@takobox/sdk";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import * as Field from "@/components/primitives/Field";
import { Input } from "@/components/primitives/Input";
import { loginOptions } from "@/queries/login";
import { formatError } from "@/utils/error";

export const Route = createFileRoute("/(auth)/login")({
  component: Login,
});

function Login() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthCredentials>();
  const navigate = useNavigate();
  const { mutateAsync: login } = useMutation(loginOptions);

  const onSubmit = async (values: AuthCredentials) => {
    try {
      await login(values);
    } catch (error) {
      setError("root", { message: formatError(error) });
      return;
    }
    await navigate({ to: "/" });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-xs flex-col gap-6">
      <h1 className="text-2xl">Log in</h1>
      <Field.Group>
        {errors.root && <Alert>{errors.root.message}</Alert>}
        <Field.Root>
          <Field.Label>Username</Field.Label>
          <Input
            {...register("username")}
            required
            type="text"
            autoComplete="username"
            placeholder="Username"
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Password</Field.Label>
          <Input
            {...register("password")}
            required
            type="password"
            autoComplete="current-password"
            placeholder="Password"
          />
        </Field.Root>
      </Field.Group>
      <Button type="submit" pending={isSubmitting}>
        Log in
      </Button>
      <span className="text-center text-muted-foreground">
        Don't have an account yet?{" "}
        <Link className="text-foreground hover:underline" to="/signup">
          Create account
        </Link>
      </span>
    </form>
  );
}
