"use client";

import { LogOutIcon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Employee } from "@/lib/types";

const STORAGE_KEY = "troop.signedInEmployeeId";

interface EmployeeSessionContextValue {
  employee: Employee;
  signOut: () => void;
}

const EmployeeSessionContext =
  createContext<EmployeeSessionContextValue | null>(null);

export function useEmployeeSession(): EmployeeSessionContextValue {
  const context = useContext(EmployeeSessionContext);
  if (!context) {
    throw new Error(
      "useEmployeeSession must be used within an EmployeeAuthGate",
    );
  }
  return context;
}

interface EmployeeAuthGateProps {
  employees: Employee[];
  children: React.ReactNode;
}

export function EmployeeAuthGate({
  employees,
  children,
}: EmployeeAuthGateProps) {
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const storedId = window.localStorage.getItem(STORAGE_KEY);
    const match = employees.find((e) => e.id === storedId) ?? null;
    setEmployee(match);
    setStatus("ready");
  }, [employees]);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setEmployee(null);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const match = employees.find(
      (employee) => employee.id === selectedEmployeeId && employee.pin === pin,
    );
    if (!match) {
      setError(true);
      setPin("");
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, match.id);
    setEmployee(match);
    setPin("");
    setError(false);
  }

  if (status === "loading") {
    return null;
  }

  if (!employee) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Employee Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Select
                value={selectedEmployeeId}
                onValueChange={(value) => {
                  setSelectedEmployeeId(value ?? "");
                  setError(false);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your name" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                autoFocus
                inputMode="numeric"
                type="password"
                placeholder="Enter your PIN"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
              />
              {error ? (
                <p className="text-sm text-destructive">
                  Incorrect name/PIN combination. Try again.
                </p>
              ) : null}
              <Button
                type="submit"
                disabled={pin.length === 0 || selectedEmployeeId.length === 0}
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <EmployeeSessionContext.Provider value={{ employee, signOut }}>
      <div className="flex items-center justify-end gap-2 pb-2 text-sm text-muted-foreground">
        <span>
          Signed in as{" "}
          <span className="font-medium text-foreground">{employee.name}</span>
        </span>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOutIcon className="h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>
      {children}
    </EmployeeSessionContext.Provider>
  );
}
