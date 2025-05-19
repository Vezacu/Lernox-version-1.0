"use client";

import React from "react";
import { Box, Container } from "@chakra-ui/react";
import ResultForm from "@/components/forms/ResultForm";

export default function ResultsPage() {
  return (
    <Container maxW="container.xl" py={6}>
      <ResultForm/>
    </Container>
  );
}