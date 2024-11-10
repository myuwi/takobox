interface NavProps {
  user: null;
}

export default function Nav({ user }: NavProps) {
  return (
    <nav class="flex gap-4 justify-between items-center py-4 px-6 mx-auto max-w-screen-xl">
      <a href="/" class="text-xl">
        Tako<span class="text-primary">box</span>
      </a>
      <div class="flex gap-4 justify-end items-center">
        {user
          ? (
            <>
              <span>Logged in as {user}</span>
              <a href="/logout" class="btn btn-outline">Log out</a>
            </>
          )
          : (
            <>
              <a href="/login" class="btn btn-ghost">Log in</a>
              <a href="/signup" class="btn btn-primary">Sign up</a>
            </>
          )}
      </div>
    </nav>
  );
}
