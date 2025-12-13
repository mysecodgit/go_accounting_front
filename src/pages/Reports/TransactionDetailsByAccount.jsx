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

const TransactionDetailsByAccount = () => {
  document.title = "Transaction Details by Account";
  const { id: buildingId } = useParams();

  const [isLoading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [units, setUnits] = useState([]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      start_date: moment().subtract(30, "days").format("YYYY-MM-DD"),
      end_date: moment().format("YYYY-MM-DD"),
      account_id: "",
      unit_id: "",
    },
    validationSchema: Yup.object({
      start_date: Yup.string().required("Start date is required"),
      end_date: Yup.string().required("End date is required"),
      account_id: Yup.number(),
      unit_id: Yup.number(),
    }),
    onSubmit: async (values) => {
      await fetchReport(values.start_date, values.end_date, values.account_id, values.unit_id);
    },
  });

  const fetchAccounts = async () => {
    try {
      let url = "accounts";
      if (buildingId) {
        url = `buildings/${buildingId}/accounts`;
      }
      const { data } = await axiosInstance.get(url);
      setAccounts(data || []);
    } catch (error) {
      console.log("Error fetching accounts", error);
    }
  };

  const fetchUnits = async () => {
    try {
      let url = "units";
      if (buildingId) {
        url = `buildings/${buildingId}/units`;
      }
      const { data } = await axiosInstance.get(url);
      setUnits(data || []);
    } catch (error) {
      console.log("Error fetching units", error);
    }
  };

  const fetchReport = async (startDate, endDate, accountId, unitId) => {
    if (!buildingId) {
      toast.error("Building ID is required");
      return;
    }

    setLoading(true);
    try {
      let url = `buildings/${buildingId}/reports/transaction-details-by-account?start_date=${startDate}&end_date=${endDate}`;
      if (accountId) {
        url += `&account_id=${accountId}`;
      }
      if (unitId) {
        url += `&unit_id=${unitId}`;
      }
      const { data } = await axiosInstance.get(url);
      setReport(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch report");
      console.error("Error fetching transaction details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchUnits();
  }, [buildingId]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Transaction Details by Account" breadcrumbItem="Transaction Details by Account" />
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
                    <Col md={3}>
                      <Label>Account (Optional)</Label>
                      <Input
                        name="account_id"
                        type="select"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.account_id || ""}
                      >
                        <option value="">All Accounts</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_name} ({account.account_number})
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={3}>
                      <Label>Unit (Optional)</Label>
                      <Input
                        name="unit_id"
                        type="select"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.unit_id || ""}
                      >
                        <option value="">All Units</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.unit_number || unit.name || `Unit ${unit.id}`}
                          </option>
                        ))}
                      </Input>
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
          ) : report && report.accounts && report.accounts.length > 0 ? (
            <Row>
              <Col xs={12}>
                <Card>
                  <CardBody>
                    <div className="mb-3">
                      <h5>Transaction Details by Account</h5>
                      <p className="text-muted">
                        Period: {moment(report.start_date).format("YYYY-MM-DD")} to {moment(report.end_date).format("YYYY-MM-DD")}
                      </p>
                    </div>
                    <div className="table-responsive">
                      <Table bordered striped>
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>Transaction #</th>
                            <th>Type</th>
                            <th>Account</th>
                            <th>People</th>
                            <th>Description</th>
                            <th className="text-end">Debit</th>
                            <th className="text-end">Credit</th>
                            <th className="text-end">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.accounts.map((accountDetail, accountIndex) => {
                            if (accountDetail.is_total_row) {
                              // Total row for account
                              return (
                                <tr key={`total-${accountDetail.account_id}-${accountIndex}`} style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                                  <td colSpan="6" className="text-end">
                                    TOTAL
                                  </td>
                                  <td className="text-end">{parseFloat(accountDetail.total_debit || 0).toFixed(2)}</td>
                                  <td className="text-end">{parseFloat(accountDetail.total_credit || 0).toFixed(2)}</td>
                                  <td className="text-end">{parseFloat(accountDetail.total_balance || 0).toFixed(2)}</td>
                                </tr>
                              );
                            } else {
                              // Account header and splits
                              return (
                                <React.Fragment key={`account-${accountDetail.account_id}-${accountIndex}`}>
                                  {/* Account Header */}
                                  <tr style={{ backgroundColor: "#e9ecef", fontWeight: "bold" }}>
                                    <td colSpan="9">
                                      {accountDetail.account_name} ({accountDetail.account_number}) - {accountDetail.account_type}
                                    </td>
                                  </tr>
                                  {/* Splits for this account */}
                                  {accountDetail.splits.map((split, splitIndex) => (
                                    <tr key={`split-${split.split_id}-${splitIndex}`}>
                                      <td>{moment(split.transaction_date).format("YYYY-MM-DD")}</td>
                                      <td>{split.transaction_number || "N/A"}</td>
                                      <td>{split.transaction_type}</td>
                                      <td></td>
                                      <td>{split.people_name || (split.people_id ? `ID: ${split.people_id}` : "N/A")}</td>
                                      <td>{split.transaction_memo || split.description || "N/A"}</td>
                                      <td className="text-end">{split.debit ? parseFloat(split.debit).toFixed(2) : "-"}</td>
                                      <td className="text-end">{split.credit ? parseFloat(split.credit).toFixed(2) : "-"}</td>
                                      <td className="text-end">{parseFloat(split.balance || 0).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              );
                            }
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                            <td colSpan="6" className="text-end">Grand Total</td>
                            <td className="text-end">{parseFloat(report.grand_total_debit || 0).toFixed(2)}</td>
                            <td className="text-end">{parseFloat(report.grand_total_credit || 0).toFixed(2)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </Table>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : report && report.accounts && report.accounts.length === 0 ? (
            <Row>
              <Col xs={12}>
                <Card>
                  <CardBody>
                    <div className="text-center">
                      <p>No transactions found for the selected criteria.</p>
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

export default TransactionDetailsByAccount;

