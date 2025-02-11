"use client";
import { signIn } from "@/app/lib/actions";
import { Alert, Box, Button, Card, Container, TextField } from "@mui/material";
import { useActionState } from "react";

export default function LoginForm() {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <Container maxWidth="sm">
      <Card variant="outlined">
        <Box component="form" action={action}>
          <TextField
            id="email"
            label="Email"
            variant="outlined"
            name="email"
            error={!!state?.errors?.email}
            helperText={state?.errors?.email?.[0]}
          />
          <TextField
            id="password"
            label="Password"
            variant="outlined"
            name="password"
            error={!!state?.errors?.password}
            helperText={state?.errors?.password?.[0]}
          />
          <Button type="submit" variant="text" loading={pending}>
            Text
          </Button>
        </Box>
        {state?.message ? (
          <Alert severity="error">{state?.message}</Alert>
        ) : null}
      </Card>
    </Container>
  );
}
