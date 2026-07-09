"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ApiError } from "@/shared/lib/send-request";
import { useValidateKey } from "@/features/auth";

export default function AccessGatePage() {
  const router = useRouter();
  const [houseKey, setHouseKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const validateKey = useValidateKey();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await validateKey.mutateAsync(houseKey);
      router.push("/beta/home");
      router.refresh();
    } catch (err) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (err instanceof ApiError && err.status === 429) {
        setError("Please wait before trying again");
      } else if (nextAttempts >= 3) {
        setError("Please wait before trying again");
      } else {
        setError("Access denied");
      }
    }
  }

  return (
    <div className="flex min-h-dvh w-full bg-white">
      <div className="relative hidden w-[55%] shrink-0 overflow-hidden md:block">
        <Image
          src="/assets/coming-soon.png"
          alt="DADAN campaign"
          fill
          priority
          quality={85}
          className="object-cover object-top"
        />
      </div>

      <div className="flex min-h-dvh flex-1 flex-col bg-white px-6 py-8 text-[#1a1a1a] md:px-14">
        <header className="mb-12 flex items-center justify-between md:mb-12">
          <div className="relative">
            <Image
              src="/assets/dadan-logo.png"
              alt="DADAN"
              width={140}
              height={24}
              priority
              quality={75}
              className="block invert"
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border border-[#d4d4d4] bg-transparent px-3 py-1.5 text-[0.8125rem] font-medium tracking-wide text-[#1a1a1a] transition-colors hover:border-[#999]"
          >
            EN
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </header>

        <div className="relative mb-8 aspect-4/3 w-full overflow-hidden md:hidden">
          <Image
            src="/assets/coming-soon.png"
            alt="DADAN campaign"
            fill
            priority
            quality={85}
            className="object-cover object-top"
          />
        </div>

        <main className="flex max-w-[440px] flex-1 flex-col justify-center">
          <h1 className="mb-8 font-english text-[2.5rem] font-normal leading-tight tracking-tight text-[#1a1a1a] md:text-[2.5rem]">
            A Story Told
          </h1>

          <h2 className="mb-2 text-[1.0625rem] font-semibold leading-snug text-[#1a1a1a]">
            Welcome to the House of DADAN
          </h2>

          <p className="mb-10 text-[0.9375rem] font-normal leading-relaxed text-[#555]">
            A private space where stories, heritage, and craftsmanship come
            together.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col">
            <label
              htmlFor="house-key"
              className="mb-2.5 text-sm font-semibold text-[#1a1a1a]"
            >
              House Key
            </label>
            <input
              id="house-key"
              name="houseKey"
              type="password"
              autoComplete="off"
              required
              value={houseKey}
              onChange={(event) => setHouseKey(event.target.value)}
              placeholder="Enter Your Access Key"
              className="w-full rounded-sm border border-[#d4d4d4] bg-white px-4 py-3 text-sm text-[#1a1a1a] outline-none transition-all placeholder:text-[#a0a0a0] focus:border-[#999] focus:ring-[3px] focus:ring-black/[0.04]"
            />

            {error ? (
              <p
                role="alert"
                className="mt-3 text-[0.8125rem] text-red-700"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="sr-only"
              disabled={validateKey.isPending || (attempts >= 3 && !validateKey.isPending)}
            >
              {validateKey.isPending ? (
                <span className="inline-block size-[18px] animate-spin rounded-full border-2 border-[#d4d4d4] border-t-[#1a1a1a]" />
              ) : null}
            </button>

            <a
              href="#"
              className="mt-4 text-[0.8125rem] text-[#555] underline underline-offset-[3px] transition-colors hover:text-[#1a1a1a]"
            >
              Need Assistance Accessing Your House?
            </a>
          </form>
        </main>
      </div>
    </div>
  );
}
