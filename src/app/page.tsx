import { Service, Provider } from "@prisma/client";
import CreateServiceForm from "@/components/CreateServiceForm";

// This function fetches data on the server side.
// It's called at build time or on each request in development.
async function getServices(): Promise<
  (Service & { provider: Pick<Provider, "name" | "createdAt"> })[]
> {
  // We need the full URL for server-side fetching
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/services`, {
    cache: "no-store", // Opt out of caching to see changes on refresh
  });

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

export default async function HomePage() {
  const services = await getServices();

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Seed-E Provider Dashboard</h1>

      <div className="bg-white shadow-md rounded-lg">
        <div className="px-6 py-4 border-b">
          <h2 className="text-2xl font-semibold">Listed Services</h2>
        </div>
        <ul className="divide-y divide-gray-200">
          {services.map((service) => (
            <li key={service.id} className="p-6 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    {service.provider.name} -{" "}
                    <span className="text-sm font-medium text-blue-600">
                      {service.policyType}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    XPUB:{" "}
                    <code className="text-xs bg-gray-100 p-1 rounded">{`${service.xpub.substring(
                      0,
                      15
                    )}...${service.xpub.substring(
                      service.xpub.length - 15
                    )}`}</code>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {Number(service.initialBackupFee)} sats (backup)
                  </p>
                  <p className="text-sm text-gray-600">
                    {Number(service.perSignatureFee)} sats (signing)
                  </p>
                  {service.monthlyFee && (
                    <p className="text-sm text-green-600">
                      {Number(service.monthlyFee)} sats/month
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
          {services.length === 0 && (
            <li className="p-6 text-center text-gray-500">
              No services have been created yet.
            </li>
          )}
        </ul>
      </div>

      <CreateServiceForm />
    </main>
  );
}
