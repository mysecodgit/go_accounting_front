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
import { formatNumber } from "../../utils/numberFormat";

const ProfitAndLossStandard = () => {
  document.title = "Profit and Loss (Standard)";
  const { id: buildingId } = useParams();

  const [isLoading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      start_date: moment().startOf("month").format("YYYY-MM-DD"),
      end_date: moment().endOf("month").format("YYYY-MM-DD"),
    },
    validationSchema: Yup.object({
      start_date: Yup.string().required("Start date is required"),
      end_date: Yup.string().required("End date is required"),
    }),
    onSubmit: async (values) => {
      await fetchReport(values);
    },
  });

  const fetchReport = async (filters) => {
    if (!buildingId) {
      toast.error("Building ID is required");
      return;
    }

    setLoading(true);
    try {
      const url = `buildings/${buildingId}/reports/profit-and-loss-standard?start_date=${filters.start_date}&end_date=${filters.end_date}`;
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
      fetchReport(validation.values);
    }
  }, [buildingId]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Profit and Loss (Standard)" breadcrumbItem="Profit and Loss (Standard)" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <Row className="mb-3">
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
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Row className="mb-3" style={{ width: "60%", textAlign: "center" }}>
                        <Col>
                          <h5>Profit and Loss Statement</h5>
                          <p className="text-muted">
                            Period: {moment(report.start_date).format("MMM DD, YYYY")} - {moment(report.end_date).format("MMM DD, YYYY")}
                          </p>
                        </Col>
                      </Row>

                      <div style={{ width: "60%", margin: "0 auto" }}>
                        <Table bordered striped className="table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>Account #</th>
                              <th>Account Name</th>
                              <th className="text-end">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td colSpan="3" className="bg-light">
                                <strong>{report.income.section_name}</strong>
                              </td>
                            </tr>
                            {report.income.accounts.map((account, index) => (
                              <tr key={`income-${account.account_id}`}>
                                <td>{account.account_number}</td>
                                <td>{account.account_name}</td>
                                <td className="text-end">{formatNumber(account.balance)}</td>
                              </tr>
                            ))}
                            {report.income.accounts.length === 0 && (
                              <tr>
                                <td colSpan="3" className="text-center text-muted">No income accounts</td>
                              </tr>
                            )}
                            <tr className="table-info">
                              <td colSpan="2" className="text-end"><strong>Total Income</strong></td>
                              <td className="text-end"><strong>{formatNumber(report.income.total)}</strong></td>
                            </tr>
                            <tr>
                              <td colSpan="3" className="bg-light">
                                <strong>{report.expenses.section_name}</strong>
                              </td>
                            </tr>
                            {report.expenses.accounts.map((account, index) => (
                              <tr key={`expense-${account.account_id}`}>
                                <td>{account.account_number}</td>
                                <td>{account.account_name}</td>
                                <td className="text-end">{formatNumber(account.balance)}</td>
                              </tr>
                            ))}
                            {report.expenses.accounts.length === 0 && (
                              <tr>
                                <td colSpan="3" className="text-center text-muted">No expense accounts</td>
                              </tr>
                            )}
                            <tr className="table-info">
                              <td colSpan="2" className="text-end"><strong>Total Expenses</strong></td>
                              <td className="text-end"><strong>{formatNumber(report.expenses.total)}</strong></td>
                            </tr>
                            <tr className={report.net_profit_loss >= 0 ? "table-success" : "table-danger"}>
                              <td colSpan="2" className="text-end"><strong>Net {report.net_profit_loss >= 0 ? "Profit" : "Loss"}</strong></td>
                              <td className="text-end"><strong>{formatNumber(report.net_profit_loss)}</strong></td>
                            </tr>
                          </tbody>
                        </Table>
                      </div>
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

export default ProfitAndLossStandard;

