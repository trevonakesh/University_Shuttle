import "dotenv/config";
import prisma from './src/prismaClient';

async function main() {
  const drivers = await prisma.driver.findMany();
  if (drivers.length > 0) {
    const driverId = drivers[0].id;
    const payments = await prisma.payment.findMany({
      where: { driverId: driverId },
      include: {
        student: {
          select: {
            fullName: true,
            studentId: true,
            phone: true
          }
        }
      }
    });
    console.log("Payments for driver", driverId, ":");
    console.log(JSON.stringify(payments, null, 2));
  } else {
    console.log("No drivers found");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
