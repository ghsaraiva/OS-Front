import Metrics from "../../components/metrics/Metrics";
import RecentOrders from "../../components/metrics/RecentOrders";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Início | Sofia Engenharia"
        description="Dashboard de Gestão de Orçamentos de Energia Solar"
      />
      <PageBreadcrumb pageTitle="Início" />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6">
          <Metrics />
        </div>

        <div className="col-span-12">
          <RecentOrders />
        </div>
      </div>
    </>
  );
}
