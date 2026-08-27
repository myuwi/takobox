import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import type { AuthCredentials } from "@takobox/sdk";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { Input } from "@/components/primitives/Input";
import { Label } from "@/components/primitives/Label";
import { loginOptions } from "@/queries/login";
import { meOptions } from "@/queries/me";
import { formatError } from "@/utils/error";

export const Route = createFileRoute("/(auth)/login")({
  component: Login,
});

function Login() {
  const { register, handleSubmit } = useForm<AuthCredentials>();
  const navigate = useNavigate();
  const { error: sessionError } = useQuery(meOptions);
  const { sessionExpired } = useLocation().state;
  const { mutateAsync: loginMutation, error } = useMutation(loginOptions);

  const getAlert = () => {
    if (error) return formatError(error);

    if (sessionError)
      return "Couldn't reach the server. If you're signed in, reloading will restore your session.";

    if (sessionExpired) return "Your session has expired. Please log in again.";

    return undefined;
  };

  const alertMessage = getAlert();

  const onSubmit = async (values: AuthCredentials) => {
    await loginMutation(values);
    await navigate({ to: "/" });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-xs flex-col gap-6">
      <h1 className="text-2xl">Log in</h1>
      <div className="flex flex-col gap-4">
        {alertMessage && <Alert>{alertMessage}</Alert>}
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
      <Button type="submit">Log in</Button>
      <span className="text-center text-muted-foreground">
        Don't have an account yet?{" "}
        <Link className="text-foreground hover:underline" to="/signup">
          Create account
        </Link>
      </span>
    </form>
  );
}
