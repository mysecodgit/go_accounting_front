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

const ProfitAndLossByUnit = () => {
  document.title = "Profit and Loss (By Unit)";
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
      const url = `buildings/${buildingId}/reports/profit-and-loss-by-unit?start_date=${filters.start_date}&end_date=${filters.end_date}`;
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
          <Breadcrumbs title="Profit and Loss (By Unit)" breadcrumbItem="Profit and Loss (By Unit)" />
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
                    <div>
                      <Row className="mb-3" style={{ textAlign: "center" }}>
                        <Col>
                          <h5>Profit & Loss by Class</h5>
                          <p className="text-muted">
                            {moment(report.start_date).format("MMMM D")} through {moment(report.end_date).format("MMMM D, YYYY")}
                          </p>
                        </Col>
                      </Row>

                      <div className="table-responsive">
                        <Table bordered className="table-hover" style={{ fontSize: "0.9rem" }}>
                          <thead className="table-light">
                            <tr>
                              <th style={{ minWidth: "200px" }}>Account</th>
                              {report.units.map((unit) => (
                                <th key={unit.unit_id} className="text-end" style={{ minWidth: "100px" }}>
                                  {unit.unit_name}
                                </th>
                              ))}
                              <th className="text-end" style={{ minWidth: "120px", fontWeight: "bold" }}>
                                TOTAL
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Income Section Header */}
                            <tr className="bg-light">
                              <td colSpan={report.units.length + 2}>
                                <strong>Income</strong>
                              </td>
                            </tr>
                            
                            {/* Income Accounts */}
                            {report.income_accounts.map((account) => (
                              <tr key={`income-${account.account_id}`}>
                                <td>
                                  {account.account_number} · {account.account_name}
                                </td>
                                {report.units.map((unit) => (
                                  <td key={`${account.account_id}-${unit.unit_id}`} className="text-end">
                                    {account.balances[unit.unit_id] 
                                      ? parseFloat(account.balances[unit.unit_id]).toFixed(2)
                                      : "0.00"}
                                  </td>
                                ))}
                                <td className="text-end">
                                  <strong>{parseFloat(account.total).toFixed(2)}</strong>
                                </td>
                              </tr>
                            ))}
                            
                            {/* Total Income Row */}
                            <tr style={{ borderTop: "2px solid #000", backgroundColor: "#f8f9fa" }}>
                              <td>
                                <strong>Total Income</strong>
                              </td>
                              {report.units.map((unit) => (
                                <td key={`total-income-${unit.unit_id}`} className="text-end">
                                  <strong style={{ textDecoration: "underline" }}>
                                    {parseFloat(report.total_income[unit.unit_id] || 0).toFixed(2)}
                                  </strong>
                                </td>
                              ))}
                              <td className="text-end">
                                <strong style={{ textDecoration: "underline" }}>
                                  {parseFloat(report.grand_total_income).toFixed(2)}
                                </strong>
                              </td>
                            </tr>

                            {/* Expense Section Header */}
                            <tr className="bg-light">
                              <td colSpan={report.units.length + 2}>
                                <strong>Expense</strong>
                              </td>
                            </tr>
                            
                            {/* Expense Accounts */}
                            {report.expense_accounts.length > 0 ? (
                              report.expense_accounts.map((account) => (
                                <tr key={`expense-${account.account_id}`}>
                                  <td>
                                    {account.account_number} · {account.account_name}
                                  </td>
                                  {report.units.map((unit) => (
                                    <td key={`${account.account_id}-${unit.unit_id}`} className="text-end">
                                      {account.balances[unit.unit_id] 
                                        ? parseFloat(account.balances[unit.unit_id]).toFixed(2)
                                        : "0.00"}
                                    </td>
                                  ))}
                                  <td className="text-end">
                                    <strong>{parseFloat(account.total).toFixed(2)}</strong>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={report.units.length + 2} className="text-center text-muted">
                                  No expense accounts
                                </td>
                              </tr>
                            )}
                            
                            {/* Total Expenses Row */}
                            <tr style={{ borderTop: "2px solid #000", backgroundColor: "#f8f9fa" }}>
                              <td>
                                <strong>Total Expenses</strong>
                              </td>
                              {report.units.map((unit) => (
                                <td key={`total-expenses-${unit.unit_id}`} className="text-end">
                                  <strong style={{ textDecoration: "underline" }}>
                                    {parseFloat(report.total_expenses[unit.unit_id] || 0).toFixed(2)}
                                  </strong>
                                </td>
                              ))}
                              <td className="text-end">
                                <strong style={{ textDecoration: "underline" }}>
                                  {parseFloat(report.grand_total_expenses).toFixed(2)}
                                </strong>
                              </td>
                            </tr>

                            {/* Net Income Row */}
                            <tr style={{ borderTop: "2px solid #000", backgroundColor: "#f8f9fa" }}>
                              <td>
                                <strong>Net Income</strong>
                              </td>
                              {report.units.map((unit) => (
                                <td key={`net-income-${unit.unit_id}`} className="text-end">
                                  <strong style={{ textDecoration: "underline" }}>
                                    {parseFloat(report.net_profit_loss[unit.unit_id] || 0).toFixed(2)}
                                  </strong>
                                </td>
                              ))}
                              <td className="text-end">
                                <strong style={{ textDecoration: "underline" }}>
                                  {parseFloat(report.grand_total_net_profit_loss).toFixed(2)}
                                </strong>
                              </td>
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

export default ProfitAndLossByUnit;
