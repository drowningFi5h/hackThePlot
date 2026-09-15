"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { flagSubmit } from "@/actions/flagSubmit";
import { HoverBorderGradient } from "./ui/hover-border-gradient";
import { Question } from "@/types/General";
import { useRouter } from "next/navigation";

export default function FlagForm(props: { type: boolean; question: Question }) {
  const router = useRouter();

  return (
    <form
      className="flex gap-2"
      action={async (formData) => {
        let flag = formData.get("flag")?.toString();
        if (!flag) return alert("Enter a flag u moron");

        const submission = await flagSubmit(props.question.id, flag);

        if (submission.error) alert(`ERR: ${submission.message}`);
        else {
          alert("Voila! You got it right!");
          router.push("/questions");
        }
      }}
    >
      <Input
        type="text"
        placeholder="flag{...}"
        className="flex-1 !bg-black b h-[2.7rem] order-zinc-700 text-white rounded-full placeholder-zinc-500"
        name="flag"
      />
      <HoverBorderGradient
        containerClassName="rounded-full"
        as="button"
        className="bg-black text-black dark:text-white flex items-center space-x-4 px-8 sm:w-full"
        typeof="submit"
      >
        <span className="w-full bg-black hover:bg-black text-white">
          Submit
        </span>
      </HoverBorderGradient>
    </form>
  );
}
