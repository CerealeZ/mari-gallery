import {
  Box,
  Button,
  Center,
  Heading,
  Text,
  VStack,
  Link as ChakraLink,
  Image,
} from "@chakra-ui/react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { MoveRight } from "lucide-react";
import { Link } from "react-router";

export default function Start() {
  return (
    <Center h={"dvh"}>
      <VStack textAlign={"center"}>
        <Heading textStyle={"3xl"}>Mari Gallery</Heading>
        <Text textWrap={"pretty"}>
          Un lugar donde puedes compartir tus fotos
        </Text>
        <Box>
          <Box>
            <SignedOut>
              <SignInButton forceRedirectUrl={"/dashboard"}>
                <Button
                  variant={"outline"}
                  backgroundColor={"purple.600"}
                  color={"white"}
                >
                  <MoveRight /> Ingresar
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <ChakraLink
                asChild
                backgroundColor={"purple.600"}
                rounded={"l2"}
                p={2}
                color={"white"}
                textStyle={"sm"}
                fontWeight={"bold"}
              >
                <Link to="/dashboard">
                  <MoveRight /> Ir para el dashboard
                </Link>
              </ChakraLink>
            </SignedIn>
          </Box>

          <Text as={"small"} display={"block"}>
            Usando tecnología de{" "}
            <ChakraLink href="https://clerk.com/">Clerk</ChakraLink>
          </Text>
        </Box>
        <Box>
          <Image src="https://res.cloudinary.com/dkffqztdd/image/upload/v1747693111/DW_ALBUM_08_aq24eo.webp" />
        </Box>
      </VStack>
    </Center>
  );
}
