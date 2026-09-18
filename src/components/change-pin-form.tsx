"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type ChangePinState, changeEmployeePin } from "@/lib/employee-actions";
import type { Employee } from "@/lib/types";

const initialState: ChangePinState = { status: "idle" };

interface ChangePinFormProps {
  employee: Employee;
  admins: Employee[];
}

export function ChangePinForm({ employee, admins }: ChangePinFormProps) {
  const [state, formAction, isPending] = useActionState(
    changeEmployeePin,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="employeeId" value={employee.id} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="adminId">Admin authorization</Label>
        <Select
          name="adminId"
          required
          items={admins.map((admin) => ({
            value: admin.id,
            label: admin.name,
          }))}
        >
          <SelectTrigger id="adminId" className="w-full">
            <SelectValue placeholder="Select an admin" />
          </SelectTrigger>
          <SelectContent>
            {admins.map((admin) => (
              <SelectItem key={admin.id} value={admin.id}>
                {admin.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="adminPin">Admin PIN</Label>
        <Input
          id="adminPin"
          name="adminPin"
          type="password"
          inputMode="numeric"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPin">New PIN for {employee.name}</Label>
        <Input
          id="newPin"
          name="newPin"
          type="password"
          inputMode="numeric"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPin">Confirm new PIN</Label>
        <Input
          id="confirmPin"
          name="confirmPin"
          type="password"
          inputMode="numeric"
          required
        />
      </div>

      {state.status === "error" ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-sm text-green-600 dark:text-green-500">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Updating…" : "Update PIN"}
      </Button>
    </form>
  );
}
