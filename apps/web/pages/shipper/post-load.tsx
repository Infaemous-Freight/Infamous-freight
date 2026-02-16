/**
 * Post New Load - Shipper Form
 * Allows shippers to post new freight loads
 */

import React, { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { getToken } from "../../lib/session";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementButton,
  NumberDecrementButton,
  Select,
  Textarea,
  VStack,
  HStack,
  Card,
  CardBody,
  useToast,
} from "@chakra-ui/react";

const PostLoadForm: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const initialFormData = {
    pickupCity: "",
    pickupState: "",
    pickupZip: "",
    pickupDate: "",
    pickupTime: "08:00",
    deliveryCity: "",
    deliveryState: "",
    deliveryZip: "",
    deliveryDate: "",
    deliveryTime: "17:00",
    weight: 20000,
    length: 53,
    commodity: "",
    equipmentType: "dry van",
    temperature: "",
    hazmat: false,
    rate: 1500,
    notes: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  };

  type FormData = typeof initialFormData;

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleInputChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (
        !formData.pickupCity ||
        !formData.deliveryCity ||
        !formData.pickupDate ||
        !formData.deliveryDate
      ) {
        toast({
          title: "Missing required fields",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
      const authToken = getToken();
      const origin = `${formData.pickupCity}, ${formData.pickupState} ${formData.pickupZip}`.trim();
      const destination =
        `${formData.deliveryCity}, ${formData.deliveryState} ${formData.deliveryZip}`.trim();

      const response = await fetch(`${apiBaseUrl}/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          origin,
          destination,
          reference: `LOAD-${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error || "Unable to post load");
      }

      toast({
        title: "Load Posted Successfully!",
        description: "Your load is now visible to carriers",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Redirect to dashboard
      router.push("/shipper/dashboard");
    } catch (error) {
      // Error posting load
      toast({
        title: "Error posting load",
        description: error instanceof Error ? error.message : undefined,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const US_STATES = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
  ];

  return (
    <>
      <Head>
        <title>Post New Load - Shipper Portal</title>
      </Head>

      <Box minH="100vh" bg="gray.50" py={8}>
        <Container maxW="container.lg">
          <Heading mb={8}>Post New Load</Heading>

          <Grid templateColumns={{ base: "1fr", md: "3fr 1fr" }} gap={6}>
            {/* Form */}
            <Card>
              <CardBody>
                <VStack spacing={6}>
                  {/* Pickup Information */}
                  <Box w="100%">
                    <Heading size="md" mb={4}>
                      Pickup Information
                    </Heading>

                    <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={4}>
                      <FormControl isRequired>
                        <FormLabel>City</FormLabel>
                        <Input
                          placeholder="e.g., Dallas"
                          value={formData.pickupCity}
                          onChange={(e) => handleInputChange("pickupCity", e.target.value)}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>State</FormLabel>
                        <Select
                          value={formData.pickupState}
                          onChange={(e) => handleInputChange("pickupState", e.target.value)}
                        >
                          <option value="">Select State</option>
                          {US_STATES.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>ZIP Code</FormLabel>
                        <Input
                          placeholder="e.g., 75001"
                          value={formData.pickupZip}
                          onChange={(e) => handleInputChange("pickupZip", e.target.value)}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Date</FormLabel>
                        <Input
                          type="date"
                          value={formData.pickupDate}
                          onChange={(e) => handleInputChange("pickupDate", e.target.value)}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Time</FormLabel>
                        <Input
                          type="time"
                          value={formData.pickupTime}
                          onChange={(e) => handleInputChange("pickupTime", e.target.value)}
                        />
                      </FormControl>
                    </Grid>
                  </Box>

                  {/* Delivery Information */}
                  <Box w="100%">
                    <Heading size="md" mb={4}>
                      Delivery Information
                    </Heading>

                    <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={4}>
                      <FormControl isRequired>
                        <FormLabel>City</FormLabel>
                        <Input
                          placeholder="e.g., Houston"
                          value={formData.deliveryCity}
                          onChange={(e) => handleInputChange("deliveryCity", e.target.value)}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>State</FormLabel>
                        <Select
                          value={formData.deliveryState}
                          onChange={(e) => handleInputChange("deliveryState", e.target.value)}
                        >
                          <option value="">Select State</option>
                          {US_STATES.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>ZIP Code</FormLabel>
                        <Input
                          placeholder="e.g., 77001"
                          value={formData.deliveryZip}
                          onChange={(e) => handleInputChange("deliveryZip", e.target.value)}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Date</FormLabel>
                        <Input
                          type="date"
                          value={formData.deliveryDate}
                          onChange={(e) => handleInputChange("deliveryDate", e.target.value)}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Time</FormLabel>
                        <Input
                          type="time"
                          value={formData.deliveryTime}
                          onChange={(e) => handleInputChange("deliveryTime", e.target.value)}
                        />
                      </FormControl>
                    </Grid>
                  </Box>

                  {/* Freight Details */}
                  <Box w="100%">
                    <Heading size="md" mb={4}>
                      Freight Details
                    </Heading>

                    <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={4}>
                      <FormControl isRequired>
                        <FormLabel>Weight (lbs)</FormLabel>
                        <NumberInput
                          value={formData.weight}
                          onChange={(val) => handleInputChange("weight", parseInt(val))}
                          min={1}
                          max={80000}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementButton />
                            <NumberDecrementButton />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Trailer Length (ft)</FormLabel>
                        <Select
                          value={formData.length}
                          onChange={(e) => handleInputChange("length", parseInt(e.target.value))}
                        >
                          <option value="20">20 ft</option>
                          <option value="24">24 ft</option>
                          <option value="26">26 ft</option>
                          <option value="28">28 ft</option>
                          <option value="40">40 ft</option>
                          <option value="48">48 ft</option>
                          <option value="53">53 ft</option>
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Equipment Type</FormLabel>
                        <Select
                          value={formData.equipmentType}
                          onChange={(e) => handleInputChange("equipmentType", e.target.value)}
                        >
                          <option value="dry van">Dry Van</option>
                          <option value="reefer">Reefer</option>
                          <option value="flatbed">Flatbed</option>
                          <option value="tanker">Tanker</option>
                          <option value="box truck">Box Truck</option>
                          <option value="sprinter">Sprinter Van</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Commodity</FormLabel>
                        <Input
                          placeholder="e.g., Electronics, Produce"
                          value={formData.commodity}
                          onChange={(e) => handleInputChange("commodity", e.target.value)}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Temperature Control</FormLabel>
                        <Select
                          value={formData.temperature}
                          onChange={(e) => handleInputChange("temperature", e.target.value)}
                        >
                          <option value="">Not Required</option>
                          <option value="ambient">Ambient (65-75°F)</option>
                          <option value="cool">Cool (50-64°F)</option>
                          <option value="cold">Cold (32-49°F)</option>
                          <option value="frozen">Frozen (Below 0°F)</option>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Box>

                  {/* Pricing */}
                  <Box w="100%">
                    <Heading size="md" mb={4}>
                      Pricing
                    </Heading>

                    <FormControl isRequired>
                      <FormLabel>Total Rate ($)</FormLabel>
                      <NumberInput
                        value={formData.rate}
                        onChange={(val) => handleInputChange("rate", parseInt(val))}
                        min={100}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementButton />
                          <NumberDecrementButton />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </Box>

                  {/* Additional Notes */}
                  <FormControl w="100%">
                    <FormLabel>Special Instructions</FormLabel>
                    <Textarea
                      placeholder="Any special handling required..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      rows={4}
                    />
                  </FormControl>

                  {/* Contact Information */}
                  <Box w="100%">
                    <Heading size="md" mb={4}>
                      Contact Information
                    </Heading>

                    <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                      <FormControl isRequired>
                        <FormLabel>Name</FormLabel>
                        <Input
                          placeholder="Your name"
                          value={formData.contactName}
                          onChange={(e) => handleInputChange("contactName", e.target.value)}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Phone</FormLabel>
                        <Input
                          placeholder="(555) 123-4567"
                          value={formData.contactPhone}
                          onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={formData.contactEmail}
                          onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                        />
                      </FormControl>
                    </Grid>
                  </Box>

                  {/* Actions */}
                  <HStack spacing={4} w="100%" pt={4} justify="flex-end">
                    <Button variant="outline" onClick={() => router.back()} isDisabled={loading}>
                      Cancel
                    </Button>
                    <Button colorScheme="blue" isLoading={loading} onClick={handleSubmit}>
                      Post Load
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Preview/Summary */}
            <Card h="fit-content" position="sticky" top={8}>
              <CardBody>
                <Heading size="sm" mb={4}>
                  Load Summary
                </Heading>
                <VStack spacing={3} align="start" fontSize="sm">
                  <Box>
                    <Box color="gray.600" mb={1}>
                      From
                    </Box>
                    <Box fontWeight="bold">
                      {formData.pickupCity}, {formData.pickupState}
                    </Box>
                  </Box>

                  <Box>
                    <Box color="gray.600" mb={1}>
                      To
                    </Box>
                    <Box fontWeight="bold">
                      {formData.deliveryCity}, {formData.deliveryState}
                    </Box>
                  </Box>

                  <Box pt={4} borderTop="1px" borderColor="gray.200" w="100%">
                    <Box color="gray.600" mb={1}>
                      Rate
                    </Box>
                    <Box fontWeight="bold" fontSize="lg" color="green.600">
                      ${formData.rate}
                    </Box>
                  </Box>

                  <Box>
                    <Box color="gray.600" mb={1}>
                      Weight
                    </Box>
                    <Box fontWeight="bold">{formData.weight.toLocaleString()} lbs</Box>
                  </Box>

                  <Box>
                    <Box color="gray.600" mb={1}>
                      Equipment
                    </Box>
                    <Box fontWeight="bold">
                      {formData.equipmentType} ({formData.length}ft)
                    </Box>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default PostLoadForm;
