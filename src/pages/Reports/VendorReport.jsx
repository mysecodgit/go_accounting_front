import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Spinners from "../../components/Common/Spinner";
import TableContainer from "../../components/Common/TableContainer";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Label,
  Input,
  Button,
  Table,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const VendorReport = () => {
  document.title = "Vendor Report";
  const { id: buildingId } = useParams();

  const [isLoading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [people, setPeople] = useState([]);
  const [peopleTypes, setPeopleTypes] = useState([]);
  const [activeTab, setActiveTab] = useState("1");

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      people_id: "",
      start_date: moment().subtract(30, "days").format("YYYY-MM-DD"),
      end_date: moment().format("YYYY-MM-DD"),
    },
    validationSchema: Yup.object({
      start_date: Yup.string().required("Start date is required"),
      end_date: Yup.string().required("End date is required"),
    }),
    onSubmit: async (values) => {
      await fetchReport(values);
    },
  });

  const fetchPeopleTypes = async () => {
    try {
      const { data } = await axiosInstance.get("people-types");
      setPeopleTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching people types:", error);
    }
  };

  const fetchPeople = async () => {
    if (!buildingId) return;
    try {
      const url = `buildings/${buildingId}/people`;
      const { data } = await axiosInstance.get(url);
      // People API returns an array directly, not wrapped in {people: [...]}
      const allPeople = Array.isArray(data) ? data : [];
      
      // Filter for vendors only - find vendor type ID
      const vendorType = peopleTypes.find(pt => 
        pt.title && pt.title.toLowerCase().includes("vendor")
      );
      
      if (vendorType) {
        const vendors = allPeople.filter(p => 
          (p.type && p.type.id === vendorType.id) || 
          (p.type_id === vendorType.id)
        );
        setPeople(vendors);
      } else {
        // If vendor type not found, show all people (fallback)
        setPeople(allPeople);
      }
    } catch (error) {
      console.error("Error fetching people:", error);
    }
  };

  const fetchReport = async (filters) => {
    if (!buildingId) {
      toast.error("Building ID is required");
      return;
    }

    setLoading(true);
    try {
      let url = `buildings/${buildingId}/reports/vendors?start_date=${filters.start_date}&end_date=${filters.end_date}`;
      if (filters.people_id) {
        url += `&people_id=${filters.people_id}`;
      }
      const { data } = await axiosInstance.get(url);
      setReport(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch report");
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (buildingId) {
      fetchPeopleTypes();
    }
  }, [buildingId]);

  useEffect(() => {
    if (buildingId && peopleTypes.length > 0) {
      fetchPeople();
      fetchReport(validation.values);
    }
  }, [buildingId, peopleTypes]);

  const summaryColumns = [
    {
      header: "Vendor Name",
      accessorKey: "people_name",
      enableColumnFilter: false,
      enableSorting: true,
    },
    {
      header: "Type",
      accessorKey: "people_type",
      enableColumnFilter: false,
      enableSorting: true,
    },
    {
      header: "Total Invoices",
      accessorKey: "total_invoices",
      enableColumnFilter: false,
      enableSorting: true,
      cell: ({ row }) => {
        return <>{parseFloat(row.original.total_invoices || 0).toFixed(2)}</>;
      },
    },
    {
      header: "Total Payments",
      accessorKey: "total_payments",
      enableColumnFilter: false,
      enableSorting: true,
      cell: ({ row }) => {
        return <>{parseFloat(row.original.total_payments || 0).toFixed(2)}</>;
      },
    },
    {
      header: "Outstanding",
      accessorKey: "outstanding",
      enableColumnFilter: false,
      enableSorting: true,
      cell: ({ row }) => {
        const val = parseFloat(row.original.outstanding || 0);
        return (
          <span className={val >= 0 ? "text-success" : "text-danger"}>
            {val.toFixed(2)}
          </span>
        );
      },
    },
    {
      header: "Invoice Count",
      accessorKey: "invoice_count",
      enableColumnFilter: false,
      enableSorting: true,
    },
    {
      header: "Payment Count",
      accessorKey: "payment_count",
      enableColumnFilter: false,
      enableSorting: true,
    },
  ];

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Vendor Report" breadcrumbItem="Vendor Report" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <Row className="mb-3">
                    <Col md={3}>
                      <Label>Vendor</Label>
                      <Input
                        name="people_id"
                        type="select"
                        onChange={(e) => {
                          validation.setFieldValue("people_id", e.target.value);
                        }}
                        value={validation.values.people_id}
                      >
                        <option value="">All Vendors</option>
                        {people.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={3}>
                      <Label>Start Date <span className="text-danger">*</span></Label>
                      <Input
                        name="start_date"
                        type="date"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.start_date}
                        invalid={validation.touched.start_date && validation.errors.start_date ? true : false}
                      />
                    </Col>
                    <Col md={3}>
                      <Label>End Date <span className="text-danger">*</span></Label>
                      <Input
                        name="end_date"
                        type="date"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.end_date}
                        invalid={validation.touched.end_date && validation.errors.end_date ? true : false}
                      />
                    </Col>
                    <Col md={3} className="d-flex align-items-end">
                      <Button
                        type="button"
                        color="primary"
                        onClick={validation.handleSubmit}
                        disabled={isLoading}
                      >
                        Generate Report
                      </Button>
                    </Col>
                  </Row>

                  {isLoading && <Spinners />}

                  {report && !isLoading && (
                    <div>
                      <Nav tabs>
                        <NavItem>
                          <NavLink
                            className={activeTab === "1" ? "active" : ""}
                            onClick={() => setActiveTab("1")}
                          >
                            Summary
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink
                            className={activeTab === "2" ? "active" : ""}
                            onClick={() => setActiveTab("2")}
                          >
                            Details
                          </NavLink>
                        </NavItem>
                      </Nav>

                      <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                          <Row>
                            <Col>
                              <Card>
                                <CardBody>
                                  <h5 className="mb-3">Vendor Summary</h5>
                                  <TableContainer
                                    columns={summaryColumns}
                                    data={report.summary || []}
                                    isGlobalFilter={true}
                                    isPagination={false}
                                    tableClass="table-hover dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                    theadClass="table-light"
                                  />
                                  <div className="mt-3">
                                    <strong>Total Outstanding: </strong>
                                    <span className={report.total_outstanding >= 0 ? "text-success" : "text-danger"}>
                                      {parseFloat(report.total_outstanding || 0).toFixed(2)}
                                    </span>
                                  </div>
                                </CardBody>
                              </Card>
                            </Col>
                          </Row>
                        </TabPane>

                        <TabPane tabId="2">
                          <Row>
                            <Col>
                              <Card>
                                <CardBody>
                                  <h5 className="mb-3">Vendor Details</h5>
                                  {Object.keys(report.details || {}).map((peopleId) => {
                                    const details = report.details[peopleId];
                                    const person = people.find((p) => p.id === parseInt(peopleId));
                                    return (
                                      <div key={peopleId} className="mb-4">
                                        <h6>{person ? person.name : `Vendor ID: ${peopleId}`}</h6>
                                        <Table striped>
                                          <thead>
                                            <tr>
                                              <th>Date</th>
                                              <th>Type</th>
                                              <th>Invoice #</th>
                                              <th>Description</th>
                                              <th className="text-end">Amount</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {details.map((detail, index) => (
                                              <tr key={index}>
                                                <td>{moment(detail.transaction_date).format("YYYY-MM-DD")}</td>
                                                <td>{detail.transaction_type}</td>
                                                <td>{detail.invoice_no || "-"}</td>
                                                <td>{detail.description}</td>
                                                <td className="text-end">{detail.amount.toFixed(2)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </Table>
                                      </div>
                                    );
                                  })}
                                </CardBody>
                              </Card>
                            </Col>
                          </Row>
                        </TabPane>
                      </TabContent>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default VendorReport;

