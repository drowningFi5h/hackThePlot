"use client";
import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label_2";
import { Input } from "@/components/ui/input_2";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { signIn } from "@/actions/signin";
import { BackgroundBeams } from "@/components/ui/background-beams";

export default function SignupFormDemo() {
  const router = useRouter();

  const [countdown, setCountdown] = useState("");
  const targetDate: number = parseInt(
    process.env.NEXT_PUBLIC_LOCKUP_TIME || "0"
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        setCountdown("NOW");
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-screen h-screen bg-black">
      <div className="max-w-md w-full z-10 bg-black mx-auto rounded-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:rounded-2xl p-4 md:p-8 border-input border-[1px] shadow-input bg-white dark:bg-black">
        <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
          Welcome to TechHunt
        </h2>
        <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
          Login with HackThePlot to start the TechHunt grind!
        </p>

        <form
          className="my-8"
          action={async (formData) => {
            if (
              process.env.NEXT_PUBLIC_LOCKUP_TIME &&
              new Date(parseInt(process.env.NEXT_PUBLIC_LOCKUP_TIME)) < new Date()
            ) {
              const email = formData.get("email")?.toString();
              const password = formData.get("password")?.toString();

              if (!email || !password) {
                return alert("Please enter email and password");
              }

              const response = await signIn(email, password);

              if (response.error) {
                return alert(response.message);
              }

              router.push("/questions");
            } else {
              alert("TechHunt has not started yet!");
            }
          }}
        >
          <LabelInputContainer className="mb-4">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              placeholder="hacktheplot@gmail.com"
              name={"email"}
              type="email"
            />
          </LabelInputContainer>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="••••••••"
              name={"password"}
              type="password"
            />
          </LabelInputContainer>

          <button
            className="bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
            type="submit"
          >
            Log in &rarr;
            <BottomGradient />
          </button>

          <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />

          {countdown && countdown !== "NOW" && <div className="flex flex-row  -my-3 -mb-10 text-zinc-400 justify-center">
            Starting in:  
            <div className="text-center font-mono text-md text-zinc-400 ml-2">
              {countdown}
            </div>
          </div>}
        </form>
      </div>
      <BackgroundBeams className="pointer-events-none z-0" />
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};
