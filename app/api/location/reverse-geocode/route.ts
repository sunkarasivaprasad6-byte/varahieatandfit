import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        {
          error: "Latitude and longitude are required",
        },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GOOGLE_MAPS_API_KEY is missing in .env.local",
        },
        { status: 500 }
      );
    }

    const googleUrl =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?latlng=${encodeURIComponent(lat)},${encodeURIComponent(lng)}` +
      `&key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(googleUrl);

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            "Google Geocoding request failed",
        },
        { status: 500 }
      );
    }

    if (data.status !== "OK") {
      return NextResponse.json(
        {
          error:
            data.error_message ||
            `Google Geocoding status: ${data.status}`,
        },
        { status: 400 }
      );
    }

    const address =
      data.results?.[0]?.formatted_address;

    if (!address) {
      return NextResponse.json(
        {
          error:
            "No readable address was found for this location.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      address,
      latitude: Number(lat),
      longitude: Number(lng),
    });
  } catch (error) {
    console.error(
      "Reverse geocoding error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to detect the delivery address.",
      },
      { status: 500 }
    );
  }
}