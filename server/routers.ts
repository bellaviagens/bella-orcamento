import { COOKIE_NAME } from "@shared/const";
import { invokeLLM } from "./_core/llm";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  parseFlightScreenshot: publicProcedure
    .input(z.object({ imageBase64: z.string() }))
    .mutation(async ({ input }) => {
      const flightSchema = {
        type: "object",
        properties: {
          type: { type: "string", enum: ["ida", "volta"] },
          isDirect: { type: "boolean" },
          totalDuration: { type: "string" },
          operatingAirline: { type: "string" },
          segments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                airline: { type: "string" },
                flightNumber: { type: "string" },
                departureAirport: { type: "string" },
                departureCity: { type: "string" },
                departureTime: { type: "string" },
                arrivalAirport: { type: "string" },
                arrivalCity: { type: "string" },
                arrivalTime: { type: "string" },
                date: { type: "string" },
                duration: { type: "string" },
              },
              required: [
                "airline", "flightNumber", "departureAirport", "departureCity",
                "departureTime", "arrivalAirport", "arrivalCity", "arrivalTime",
                "date", "duration",
              ],
            },
          },
        },
        required: ["type", "isDirect", "totalDuration", "operatingAirline", "segments"],
      };

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a travel agent assistant. Extract flight information from screenshots of flight booking pages. Return structured JSON with all flight details including segments for connecting flights. Always respond in Portuguese.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all flight information from this screenshot. Identify if it's a one-way (ida) or return (volta) flight. For flights with connections (escalas), extract each segment separately. Include airline, flight number, airports (codes), cities, departure/arrival times, dates, and duration for each segment. Also provide total duration and operating airline.",
              },
              {
                type: "image_url",
                image_url: { url: input.imageBase64, detail: "high" },
              },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "flight_info",
            strict: true,
            schema: flightSchema as Record<string, unknown>,
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      if (typeof content === "string") {
        try {
          const parsed = JSON.parse(content);
          if (!parsed.segments || !Array.isArray(parsed.segments) || parsed.segments.length === 0) {
            throw new Error("Invalid flight data: missing segments");
          }
          return parsed;
        } catch (e) {
          console.error("Flight parse error:", e);
          throw new Error("Não foi possível extrair os dados do voo do screenshot. Verifique se a imagem contém informações de voo.");
        }
      }
      throw new Error("Resposta inválida do servidor de IA.");
    }),

  parseHotelScreenshot: publicProcedure
    .input(z.object({ imageBase64: z.string() }))
    .mutation(async ({ input }) => {
      const hotelSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
          stars: { type: "number" },
          address: { type: "string" },
          description: { type: "string" },
          rating: { type: "number" },
          ratingLabel: { type: "string" },
          amenities: { type: "array", items: { type: "string" } },
        },
        required: ["name", "stars", "address", "description", "rating", "ratingLabel", "amenities"],
      };

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a travel agent assistant. Extract hotel information from screenshots of hotel booking pages (Booking.com, Decolar, etc). Return structured JSON with all hotel details. Always respond in Portuguese.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all hotel information from this screenshot. Include hotel name, star rating (1-5), address, a brief description, guest rating (0-10) with a label (e.g. 'Excelente', 'Muito Bom'), and list of amenities visible in the screenshot.",
              },
              {
                type: "image_url",
                image_url: { url: input.imageBase64, detail: "high" },
              },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "hotel_info",
            strict: true,
            schema: hotelSchema as Record<string, unknown>,
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      if (typeof content === "string") {
        try {
          const parsed = JSON.parse(content);
          if (!parsed.name) {
            throw new Error("Invalid hotel data: missing name");
          }
          return parsed;
        } catch (e) {
          console.error("Hotel parse error:", e);
          throw new Error("Não foi possível extrair os dados do hotel do screenshot. Verifique se a imagem contém informações de hotel.");
        }
      }
      throw new Error("Resposta inválida do servidor de IA.");
    }),
});

export type AppRouter = typeof appRouter;
