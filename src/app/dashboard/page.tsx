import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

// We will get the userId from a secure session.
// For now, we'll simulate it by fetching a specific user.
// This function fetches data on the server side.
async function getClientData(username: string) {
  const client = await prisma.client.findUnique({
    where: { username },
    include: {
      service: {
        include: {
          provider: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  });

  return client;
}

export default async function ClientDashboardPage() {
  // TODO: Replace this with actual session management to get the logged-in user's username
  const loggedInUsername = "testclient"; // Hardcoded for initial iteration

  const client = await getClientData(loggedInUsername);

  if (!client) {
    // This could happen if the test user doesn't exist.
    // In production, a logged-in user would exist.
    notFound();
  }

  const { service } = client;

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-2">Client Dashboard</h1>
      <p className="text-lg text-gray-600 mb-8">
        Welcome back, <span className="font-semibold">{client.username}</span>.
      </p>

      <div className="bg-white shadow-md rounded-lg">
        <div className="px-6 py-4 border-b">
          <h2 className="text-2xl font-semibold">Your Purchased Service</h2>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Provider</p>
                <p className="text-xl font-semibold text-gray-800">
                  {service.provider.username}
                </p>
              </div>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  client.subscriptionExpiresAt &&
                  new Date(client.subscriptionExpiresAt) > new Date()
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {client.subscriptionExpiresAt &&
                new Date(client.subscriptionExpiresAt) > new Date()
                  ? `Active until ${new Date(
                      client.subscriptionExpiresAt
                    ).toLocaleDateString()}`
                  : "Subscription Expired"}
              </span>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-500">Service Type</p>
              <p className="text-lg font-medium text-blue-600">
                {service.policyType}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-500">Your XPUB</p>
              <code className="text-sm bg-gray-200 p-2 rounded-md block mt-1 overflow-x-auto">
                {service.xpub}
              </code>
            </div>

            <div className="mt-8 border-t pt-6">
              <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Request Signature
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
