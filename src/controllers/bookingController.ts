import { Request, Response } from "express";
import { Currency, paymentType, PrismaClient } from "../generated/prisma";
import { iCreatedBooking } from "../../types/booking";
import { sendBulkWhatsApp } from "../../messaging/whatsApp";
import { logActivity } from "../../middleWare/prismaLogger";

const prisma = new PrismaClient();

// ---------------- Create Booking Controller ----------------
export const createBooking = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // ---------------- Input Validation ----------------
    if (
      !data.amount ||
      !data.bookerId ||
      !Object.values(Currency).includes(data.currency) ||
      !data.name ||
      !data.phoneNumber ||
      !Object.values(paymentType).includes(data.paymentType) ||
      !data.qty ||
      !data.rideId ||
      !data.total_amount
    ) {
      return res.status(400).json({
        isSuccess: false,
        message: "All or some fields are required",
      });
    }

    // ---------------- Fetch Booker ----------------
    const booker = await prisma.user.findUnique({
      where: { id: data.bookerId },
    });

    if (!booker) {
      return res
        .status(404)
        .json({ isSuccess: false, message: "Booker not found" });
    }

    if (!booker.address) {
      return res.status(400).json({
        isSuccess: false,
        message: "Booker does not have an address set",
      });
    }

    // ---------------- Get Address & Officers ----------------
    const bookerAddress = await prisma.address.findFirst({
      where: { address: booker.address },
      include: { officers: true },
    });

    if (!bookerAddress) {
      return res.status(400).json({
        isSuccess: false,
        message: "No address record found for this booker",
      });
    }

    // ---------------- Create Booking ----------------
    const booking = await prisma.booking.create({
      data: {
        amount: data.amount,
        currency: data.currency,
        name: data.name,
        phoneNumber: data.phoneNumber,
        paymentType: data.paymentType,
        qty: data.qty,
        total_amount: data.total_amount,
        booker: { connect: { id: data.bookerId } },
        ride: { connect: { id: data.rideId } },
      },
      include: {
        ride: { include: { route: true } },
      },
    });

    if (!booking.ride || !booking.ride.route) {
      return res.status(500).json({
        isSuccess: false,
        message: "Ride or route not found for this booking",
      });
    }

    // ---------------- Fetch Admins ----------------
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { phone: true, id: true },
    });

    const officersForAddress = bookerAddress.officers;

    // ---------------- Prepare WhatsApp Messages ----------------
    const adminOfficerMsg = `
* New Booking Received *

*Booker:* ${booker.name}
*Phone:* ${booker.phone}
*Address:* ${booker.address}
*Ride:* ${booking.ride.route.from} → ${booking.ride.route.end}
*Tickets:* ${booking.qty}
*Amount Paid:* ${booking.total_amount} ${booking.currency}
*Payment Type:* ${data.paymentType}
*Booking ID:* ${booking.id}
*Date:* ${new Date(booking.createdAt).toLocaleDateString()}

Please review and confirm this booking in the system.

— *Booking Management Team* —
`;

    const clientMsg = `**Dear ${data.name},**

Your booking payment of ${booking.total_amount} ${
      booking.currency
    } has been received.

*Payment ID:* ${booking.id}  
*Ride:* ${booking.ride.route.from} → ${booking.ride.route.end}  
*Date:* ${new Date(booking.createdAt).toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}

Please keep this message as proof of payment.

Thank you for choosing us!
`;

    // ---------------- Send WhatsApp Messages Independently ----------------
    await Promise.allSettled([
      // Admins
      admins.length > 0
        ? sendBulkWhatsApp(
            admins.map((a) => a.phone!).filter(Boolean),
            adminOfficerMsg
          )
        : Promise.resolve(),

      // Officers
      officersForAddress.length > 0
        ? sendBulkWhatsApp(
            officersForAddress.map((o) => o.phone!).filter(Boolean),
            adminOfficerMsg
          )
        : Promise.resolve(),

      // Client
      data.phoneNumber
        ? sendBulkWhatsApp([data.phoneNumber], clientMsg)
        : Promise.resolve(),
    ]);

    // ---------------- Activity Logs ----------------

    // ---------------- Response ----------------
    return res.status(201).json({
      isSuccess: true,
      message:
        "Booking created successfully. WhatsApp notifications sent to client, admins, and officers.",
      booking,
    });
  } catch (error) {
    console.error("Create Booking Error:", error);
    return res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const perPage = Math.max(1, parseInt(req.query.perPage as string) || 10);

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          ride: {
            include: { route: true },
          },
          booker: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profilePhoto: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count(),
    ]);

    // ---------------- If No Data ----------------
    if (bookings.length === 0) {
      return res.status(404).json({
        isSuccess: false,
        message: "No bookings found",
      });
    }

    // ---------------- Pagination Metadata ----------------
    const totalPages = Math.ceil(total / perPage);

    // ---------------- Response ----------------
    return res.status(200).json({
      isSuccess: true,
      bookings,
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
    });
  } catch (error) {
    console.error("GetAllBookings Error:", error);
    return res.status(500).json({
      isSuccess: false,
      message: "Server error",
    });
  }
};
