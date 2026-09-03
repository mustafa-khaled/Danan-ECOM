import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import { ProfileMenu } from "./profile-menu";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockLogout = vi.fn().mockResolvedValue(undefined);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("@/features/auth", () => ({
  useClientLogout: () => ({ logout: mockLogout, isPending: false }),
}));

function renderProfileMenu(props = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ProfileMenu {...props} />
    </NextIntlClientProvider>,
  );
}

describe("ProfileMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders trigger button with profile aria label", () => {
    renderProfileMenu();
    const trigger = screen.getByRole("combobox", { name: "Profile" });
    expect(trigger).toBeInTheDocument();
  });

  it("shows options when trigger is clicked", async () => {
    renderProfileMenu();
    const trigger = screen.getByRole("combobox", { name: "Profile" });
    fireEvent.click(trigger);

    expect(screen.getByRole("option", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Log out" })).toBeInTheDocument();
  });

  it("navigates to wardrobe when Profile option is selected", async () => {
    const onNavigate = vi.fn();
    renderProfileMenu({ onNavigate });

    const trigger = screen.getByRole("combobox", { name: "Profile" });
    fireEvent.click(trigger);

    const profileOption = screen.getByRole("option", { name: "Profile" });
    fireEvent.click(profileOption);

    expect(mockPush).toHaveBeenCalledWith("/beta/profile/wardrobe");
    expect(onNavigate).toHaveBeenCalled();
  });

  it("opens logout confirmation modal when Log out option is selected", async () => {
    renderProfileMenu();

    const trigger = screen.getByRole("combobox", { name: "Profile" });
    fireEvent.click(trigger);

    const logoutOption = screen.getByRole("option", { name: "Log out" });
    fireEvent.click(logoutOption);

    // Modal opens with confirmation title and message
    expect(screen.getByText("Confirm Logout")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to log out?"),
    ).toBeInTheDocument();

    // Cancel closes the modal
    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText("Are you sure you want to log out?")).not.toBeInTheDocument();
    });
  });

  it("performs logout and redirects when confirmed in modal", async () => {
    const onNavigate = vi.fn();
    renderProfileMenu({ onNavigate });

    const trigger = screen.getByRole("combobox", { name: "Profile" });
    fireEvent.click(trigger);

    const logoutOption = screen.getByRole("option", { name: "Log out" });
    fireEvent.click(logoutOption);

    // Modal confirm button
    const confirmBtn = screen.getByRole("button", { name: "Log out" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/beta");
      expect(mockRefresh).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalled();
    });
  });
});
