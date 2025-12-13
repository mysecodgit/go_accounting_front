import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Spinners from "../../components/Common/Spinner";
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
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const CustomerBalanceSummary = () => {
  document.title = "Customer Balance Summary";
  const { id: buildingId } = useParams();

  const [isLoading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      as_of_date: moment().format("YYYY-MM-DD"),
    },
    validationSchema: Yup.object({
      as_of_date: Yup.string().required("As of date is required"),
    }),
    onSubmit: async (values) => {
      await fetchReport(values.as_of_date);
    },
  });

  const fetchReport = async (asOfDate) => {
    if (!buildingId) {
      toast.error("Building ID is required");
      return;
    }

    setLoading(true);
    try {
      let url = `buildings/${buildingId}/reports/customer-balance-summary?as_of_date=${asOfDate}`;
      const { data } = await axiosInstance.get(url);
      setReport(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch report");
      console.error("Error fetching customer balance summary:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Customer Balance Summary" breadcrumbItem="Customer Balance Summary" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <Row className="mb-3">
                    <Col md={4}>
                      <Label>As Of Date <span className="text-danger">*</span></Label>
                      <Input
                        name="as_of_date"
                        type="date"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.as_of_date}
                        invalid={validation.touched.as_of_date && validation.errors.as_of_date ? true : false}
                      />
                    </Col>
                    <Col md={3} className="d-flex align-items-end">
                      <Button
                        type="button"
                        color="primary"
                        className="me-2"
                        onClick={validation.handleSubmit}
                        disabled={isLoading}
                      >
                        Generate Report
                      </Button>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : report && report.customers && report.customers.length > 0 ? (
            <Row>
              <Col xs={12}>
                <Card>
                  <CardBody>
                    <div className="mb-3 text-center">
                      <h5>Customer Balance Summary</h5>
                      <p className="text-muted">
                        As of: {moment(report.as_of_date).format("YYYY-MM-DD")}
                      </p>
                    </div>
                    <div className="table-responsive d-flex justify-content-center">
                      <Table bordered striped style={{ width: "60%" }}>
                        <thead className="table-light">
                          <tr>
                            <th>Customer Name</th>
                            <th className="text-end">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.customers.map((customer, index) => (
                            <tr key={`customer-${customer.people_id}-${index}`}>
                              <td>{customer.people_name}</td>
                              <td className="text-end">
                                {customer.balance >= 0 ? (
                                  <span style={{ color: "black" }}>
                                    {parseFloat(customer.balance).toFixed(2)}
                                  </span>
                                ) : (
                                  <span style={{ color: "black" }}>
                                    {parseFloat(customer.balance).toFixed(2)}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                            <td className="text-end">Total Balance</td>
                            <td className="text-end">
                              <span style={{ color: "black" }}>
                                {parseFloat(report.total_balance).toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </Table>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : report && report.customers && report.customers.length === 0 ? (
            <Row>
              <Col xs={12}>
                <Card>
                  <CardBody>
                    <div className="text-center">
                      <p>No customer balances found for the selected date.</p>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : null}
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default CustomerBalanceSummary;

