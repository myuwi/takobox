import { render, screen, waitFor, within } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, test, vi } from "vitest";
import { toast, Toaster, toastError } from "./Toast";

const createAxiosError = (message: string) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    data: { message },
    status: 404,
    statusText: "Not Found",
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  });

afterEach(() => {
  toast.close();
  vi.restoreAllMocks();
});

const getToasts = () => within(screen.getByRole("region", { name: "Notifications" }));

describe("toastError", () => {
  test("shows the title and the server's message", async () => {
    render(<Toaster />);

    toastError(
      "Couldn't delete the file",
      createAxiosError("File not found or not owned by user."),
    );

    await waitFor(() => {
      expect(getToasts().getByText("Couldn't delete the file")).toBeInTheDocument();
    });
    expect(getToasts().getByText("File not found or not owned by user.")).toBeInTheDocument();
    expect(getToasts().getByLabelText("Dismiss")).toBeInTheDocument();
  });

  test("shows the title alone for non-axios errors and logs them", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Toaster />);

    const error = new Error("boom");
    toastError("Couldn't log out", error);

    await waitFor(() => {
      expect(getToasts().getByText("Couldn't log out")).toBeInTheDocument();
    });
    expect(getToasts().queryByText(/boom/)).not.toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(error);
  });
});
