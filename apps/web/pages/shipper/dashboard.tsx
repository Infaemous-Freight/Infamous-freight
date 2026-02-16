/**
 * Shipper Portal - Load Management Dashboard
 * Allows shippers to post loads, track drivers, and manage billing
 */

import React, { useState } from "react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import {
  MdAdd,
  MdLocalShipping,
  MdDollarSign,
  MdTrendingUp,
  MdCheckCircle,
  MdWarning,
  MdAccessTime,
} from "react-icons/md";
import { SHIPMENT_STATUSES } from "@infamous-freight/shared";

interface ShipmentStats {
  activeLoads: number;
  completedToday: number;
  totalRevenue: number;
  pendingPayments: number;
}

interface RecentLoad {
  id: string;
  origin: string;
  destination: string;
  rate: number;
  status: string;
  driver?: string;
  postedAt: string;
  eta?: string;
}

type ShipmentApi = {
  reference?: string;
  trackingId?: string;
  id?: string;
  origin?: string;
  destination?: string;
  rate?: number;
  priceUsd?: number;
  status?: string;
  driver?: { name?: string };
  createdAt?: string;
};

interface ShipperPortalProps {
  stats: ShipmentStats;
  recentLoads: RecentLoad[];
}

const ShipperPortal: React.FC<ShipperPortalProps> = ({ stats, recentLoads: _recentLoads }) => {
  const toast = useToast();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(0);

  const handlePostLoad = () => {
    router.push("/shipper/post-load");
  };

  const handleEditLoad = (loadId: string) => {
    toast({
      title: "Edit Load",
      description: `Edit load ${loadId} (coming soon)`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleViewTracking = (loadId: string) => {
    toast({
      title: "Real-time Tracking",
      description: `Live tracking for load ${loadId} (coming soon)`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toUpperCase()) {
      case SHIPMENT_STATUSES.COMPLETED:
        return "green";
      case SHIPMENT_STATUSES.IN_TRANSIT:
        return "blue";
      case SHIPMENT_STATUSES.CREATED:
        return "gray";
      case SHIPMENT_STATUSES.PICKED_UP:
        return "orange";
      default:
        return "gray";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case SHIPMENT_STATUSES.COMPLETED:
        return MdCheckCircle;
      case SHIPMENT_STATUSES.IN_TRANSIT:
        return MdLocalShipping;
      case SHIPMENT_STATUSES.PICKED_UP:
        return MdAccessTime;
      default:
        return MdWarning;
    }
  };

  return (
    <>
      <Head>
        <title>Shipper Portal - Infamous Freight</title>
        <meta name="description" content="Post loads, track drivers, manage billing" />
      </Head>

      <Box minH="100vh" bg="gray.50">
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py={6}>
          <Container maxW="container.xl">
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="lg">Shipper Portal</Heading>
              <Button leftIcon={<MdAdd />} colorScheme="blue" onClick={handlePostLoad}>
                Post New Load
              </Button>
            </Flex>
            <Text color="gray.600">Manage your freight loads and track real-time delivery</Text>
          </Container>
        </Box>

        {/* Main Content */}
        <Container maxW="container.xl" py={8}>
          {/* Stats Grid */}
          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            }}
            gap={6}
            mb={8}
          >
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center" gap={2}>
                    <Icon as={MdLocalShipping} /> Active Loads
                  </StatLabel>
                  <StatNumber fontSize="3xl" mt={2}>
                    {stats.activeLoads}
                  </StatNumber>
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    Across various statuses
                  </Text>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center" gap={2}>
                    <Icon as={MdCheckCircle} /> Completed Today
                  </StatLabel>
                  <StatNumber fontSize="3xl" mt={2} color="green.600">
                    {stats.completedToday}
                  </StatNumber>
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    On-time deliveries
                  </Text>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center" gap={2}>
                    <Icon as={MdDollarSign} /> Total Revenue
                  </StatLabel>
                  <StatNumber fontSize="3xl" mt={2} color="green.600">
                    ${stats.totalRevenue.toLocaleString()}
                  </StatNumber>
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    This month
                  </Text>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center" gap={2}>
                    <Icon as={MdTrendingUp} /> Pending Payments
                  </StatLabel>
                  <StatNumber fontSize="3xl" mt={2} color="orange.600">
                    ${stats.pendingPayments.toLocaleString()}
                  </StatNumber>
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    Awaiting delivery
                  </Text>
                </Stat>
              </CardBody>
            </Card>
          </Grid>

          {/* Tabs */}
          <Card>
            <CardBody>
              <Tabs index={selectedTab} onChange={setSelectedTab}>
                <TabList>
                  <Tab>Active Loads</Tab>
                  <Tab>Completed</Tab>
                  <Tab>Billing</Tab>
                  <Tab>Drivers</Tab>
                </TabList>

                <TabPanels>
                  {/* Active Loads Tab */}
                  <TabPanel>
                    <VStack spacing={4} mt={4}>
                      {loads
                        .filter((load) => load.status !== SHIPMENT_STATUSES.COMPLETED)
                        .map((load) => (
                          <Card key={load.id} w="100%" variant="elevated">
                            <CardBody>
                              <Grid
                                templateColumns={{
                                  base: "1fr",
                                  md: "1fr 1fr 1fr 1fr 1fr",
                                }}
                                gap={4}
                                align="center"
                              >
                                <Box>
                                  <Text fontSize="sm" color="gray.600">
                                    From
                                  </Text>
                                  <Text fontWeight="bold">{load.origin}</Text>
                                </Box>

                                <Box display={{ base: "none", md: "flex" }} justify="center">
                                  <Icon as={MdLocalShipping} boxSize={5} color="blue.500" />
                                </Box>

                                <Box>
                                  <Text fontSize="sm" color="gray.600">
                                    To
                                  </Text>
                                  <Text fontWeight="bold">{load.destination}</Text>
                                </Box>

                                <Box>
                                  <Text fontSize="sm" color="gray.600">
                                    Rate
                                  </Text>
                                  <Text fontWeight="bold" color="green.600">
                                    ${load.rate}
                                  </Text>
                                </Box>

                                <Box>
                                  <HStack spacing={2}>
                                    {load.status === "active" && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleEditLoad(load.id)}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          colorScheme="blue"
                                          onClick={() => handleViewTracking(load.id)}
                                        >
                                          Track
                                        </Button>
                                      </>
                                    )}
                                    {load.status === "assigned" && (
                                      <Button
                                        size="sm"
                                        colorScheme="blue"
                                        onClick={() => handleViewTracking(load.id)}
                                      >
                                        Track Driver
                                      </Button>
                                    )}
                                  </HStack>
                                </Box>
                              </Grid>

                              <Flex
                                justify="space-between"
                                mt={4}
                                pt={4}
                                borderTop="1px"
                                borderColor="gray.200"
                              >
                                <Box>
                                  <Text fontSize="xs" color="gray.600">
                                    Status
                                  </Text>
                                  <HStack spacing={1} mt={1}>
                                    <Icon
                                      as={getStatusIcon(load.status)}
                                      color={`${getStatusBadgeColor(load.status)}.500`}
                                    />
                                    <Text fontSize="sm" fontWeight="medium">
                                      {load.status}
                                    </Text>
                                  </HStack>
                                </Box>

                                {load.driver && (
                                  <Box>
                                    <Text fontSize="xs" color="gray.600">
                                      Assigned Driver
                                    </Text>
                                    <Text fontSize="sm" fontWeight="medium" mt={1}>
                                      {load.driver}
                                    </Text>
                                  </Box>
                                )}

                                {load.eta && (
                                  <Box>
                                    <Text fontSize="xs" color="gray.600">
                                      Estimated Delivery
                                    </Text>
                                    <Text fontSize="sm" fontWeight="medium" mt={1}>
                                      {load.eta}
                                    </Text>
                                  </Box>
                                )}
                              </Flex>
                            </CardBody>
                          </Card>
                        ))}

                      {loads.filter((load) => load.status !== SHIPMENT_STATUSES.COMPLETED)
                        .length === 0 && (
                        <Card w="100%" variant="elevated" bg="gray.50">
                          <CardBody textAlign="center" py={12}>
                            <Icon as={MdLocalShipping} boxSize={16} color="gray.300" mb={4} />
                            <Text fontSize="lg" color="gray.600">
                              No active loads yet
                            </Text>
                            <Button
                              mt={4}
                              leftIcon={<MdAdd />}
                              colorScheme="blue"
                              onClick={handlePostLoad}
                            >
                              Post Your First Load
                            </Button>
                          </CardBody>
                        </Card>
                      )}
                    </VStack>
                  </TabPanel>

                  {/* Completed Tab */}
                  <TabPanel>
                    <Box py={8} textAlign="center">
                      <Text color="gray.600">Completed loads tracking (coming soon)</Text>
                    </Box>
                  </TabPanel>

                  {/* Billing Tab */}
                  <TabPanel>
                    <Box py={8} textAlign="center">
                      <Text color="gray.600">Billing history and invoices (coming soon)</Text>
                    </Box>
                  </TabPanel>

                  {/* Drivers Tab */}
                  <TabPanel>
                    <Box py={8} textAlign="center">
                      <Text color="gray.600">Driver management (coming soon)</Text>
                    </Box>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </Container>
      </Box>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<ShipperPortalProps> = async (context) => {
  try {
    const { API_BASE_URL = "http://localhost:4000" } = process.env;
    const authHeader = context.req.headers.authorization || "";
    const cookieToken = context.req.cookies?.token || "";
    const authToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : cookieToken;

    let stats: ShipmentStats | null = null;
    let recentLoads: RecentLoad[] | null = null;

    if (authToken) {
      try {
        const statsRes = await fetch(`${API_BASE_URL}/api/analytics/shipper/dashboard`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (statsRes.ok) {
          const statsResult = await statsRes.json();
          if (statsResult?.success && statsResult.data) {
            stats = {
              activeLoads: statsResult.data.activeLoads || 0,
              completedToday: statsResult.data.completedToday || 0,
              totalRevenue: statsResult.data.totalRevenue || 0,
              pendingPayments: statsResult.data.pendingPayments || 0,
            };
          }
        }

        const loadsRes = await fetch(`${API_BASE_URL}/api/shipments`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (loadsRes.ok) {
          const loadsResult = await loadsRes.json();
          if (loadsResult?.ok && Array.isArray(loadsResult.shipments)) {
            recentLoads = loadsResult.shipments.slice(0, 6).map((shipment: ShipmentApi) => ({
              id: shipment.reference || shipment.trackingId || shipment.id,
              origin: shipment.origin,
              destination: shipment.destination,
              rate: shipment.rate || shipment.priceUsd || 0,
              status: shipment.status,
              driver: shipment.driver?.name,
              postedAt: shipment.createdAt,
            }));
          }
        }
      } catch {
        // API unavailable, using fallback mock data
      }
    }
    const fallbackStats: ShipmentStats = {
      activeLoads: 12,
      completedToday: 5,
      totalRevenue: 45230,
      pendingPayments: 8750,
    };

    const fallbackLoads: RecentLoad[] = [
      {
        id: "LOAD-001",
        origin: "Dallas, TX",
        destination: "Houston, TX",
        rate: 850,
        status: SHIPMENT_STATUSES.IN_TRANSIT,
        driver: "John Smith",
        postedAt: "2025-02-14T10:00:00Z",
        eta: "2025-02-14T16:30:00Z",
      },
      {
        id: "LOAD-002",
        origin: "Houston, TX",
        destination: "Austin, TX",
        rate: 650,
        status: SHIPMENT_STATUSES.CREATED,
        postedAt: "2025-02-14T11:00:00Z",
      },
    ];

    return {
      props: {
        stats: stats || fallbackStats,
        recentLoads: recentLoads || fallbackLoads,
      },
      revalidate: 60, // ISR: revalidate every 60 seconds
    };
  } catch {
    // Error loading shipper data - return 404
    return {
      notFound: true,
    };
  }
};

export default ShipperPortal;
