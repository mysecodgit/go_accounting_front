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

const BalanceSheet = () => {
  document.title = "Balance Sheet";
  const { id: buildingId } = useParams();

  const [isLoading, setLoading] = useState(false);
  const [balanceSheet, setBalanceSheet] = useState(null);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      as_of_date: moment().format("YYYY-MM-DD"),
    },
    validationSchema: Yup.object({
      as_of_date: Yup.string().required("As of date is required"),
    }),
    onSubmit: async (values) => {
      await fetchBalanceSheet(values.as_of_date);
    },
  });

  const fetchBalanceSheet = async (asOfDate) => {
    if (!buildingId) {
      toast.error("Building ID is required");
      return;
    }

    setLoading(true);
    try {
      const url = `buildings/${buildingId}/reports/balance-sheet?as_of_date=${asOfDate}`;
      const { data } = await axiosInstance.get(url);
      setBalanceSheet(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch balance sheet");
      console.error("Error fetching balance sheet:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (buildingId) {
      fetchBalanceSheet(validation.values.as_of_date);
    }
  }, [buildingId]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Balance Sheet" breadcrumbItem="Balance Sheet" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <Row className="mb-3">
                    <Col md={4}>
                      <Label>As of Date <span className="text-danger">*</span></Label>
                      <Input
                        name="as_of_date"
                        type="date"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.as_of_date}
                        invalid={validation.touched.as_of_date && validation.errors.as_of_date ? true : false}
                      />
                    </Col>
                    <Col md={4} className="d-flex align-items-end">
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

                  {isLoading && <Spinners />}

                  {balanceSheet && !isLoading && (
                    <div>
                      <Row className="mb-3">
                        <Col>
                          <h4>Balance Sheet</h4>
                          <p className="text-muted">As of: {moment(balanceSheet.as_of_date).format("MMMM DD, YYYY")}</p>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Card>
                            <CardBody>
                              <h5 className="mb-3">{balanceSheet.assets.section_name}</h5>
                              <Table striped>
                                <thead>
                                  <tr>
                                    <th>Account</th>
                                    <th className="text-end">Balance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {balanceSheet.assets.accounts.map((account, index) => (
                                    <tr key={index}>
                                      <td>{account.account_name}</td>
                                      <td className="text-end">{formatNumber(account.balance)}</td>
                                    </tr>
                                  ))}
                                  <tr className="fw-bold">
                                    <td>Total Assets</td>
                                    <td className="text-end">{formatNumber(balanceSheet.total_assets)}</td>
                                  </tr>
                                </tbody>
                              </Table>
                            </CardBody>
                          </Card>
                        </Col>

                        <Col md={6}>
                          <Card>
                            <CardBody>
                              <h5 className="mb-3">{balanceSheet.liabilities.section_name}</h5>
                              <Table striped>
                                <thead>
                                  <tr>
                                    <th>Account</th>
                                    <th className="text-end">Balance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {balanceSheet.liabilities.accounts.map((account, index) => (
                                    <tr key={index}>
                                      <td>{account.account_name}</td>
                                      <td className="text-end">{formatNumber(account.balance)}</td>
                                    </tr>
                                  ))}
                                  <tr className="fw-bold">
                                    <td>Total Liabilities</td>
                                    <td className="text-end">{formatNumber(balanceSheet.liabilities.total)}</td>
                                  </tr>
                                </tbody>
                              </Table>
                            </CardBody>
                          </Card>

                          <Card className="mt-3">
                            <CardBody>
                              <h5 className="mb-3">{balanceSheet.equity.section_name}</h5>
                              <Table striped>
                                <thead>
                                  <tr>
                                    <th>Account</th>
                                    <th className="text-end">Balance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {balanceSheet.equity.accounts.map((account, index) => (
                                    <tr key={index} style={account.account_id === 0 ? { fontStyle: "italic" } : {}}>
                                      <td>{account.account_name}</td>
                                      <td className="text-end">{formatNumber(account.balance)}</td>
                                    </tr>
                                  ))}
                                  <tr className="fw-bold">
                                    <td>Total Equity</td>
                                    <td className="text-end">{formatNumber(balanceSheet.equity.total)}</td>
                                  </tr>
                                </tbody>
                              </Table>
                            </CardBody>
                          </Card>
                        </Col>
                      </Row>

                      <Row className="mt-3">
                        <Col>
                          <Card>
                            <CardBody>
                              <Row>
                                <Col md={6}>
                                  <h5>Total Assets: {formatNumber(balanceSheet.total_assets)}</h5>
                                </Col>
                                <Col md={6}>
                                  <h5>Total Liabilities & Equity: {formatNumber(balanceSheet.total_liabilities_and_equity)}</h5>
                                </Col>
                              </Row>
                              <Row className="mt-2">
                                <Col>
                                  <p className={balanceSheet.is_balanced ? "text-success" : "text-danger"}>
                                    {balanceSheet.is_balanced ? "✓ Balanced" : "✗ Not Balanced"}
                                  </p>
                                </Col>
                              </Row>
                            </CardBody>
                          </Card>
                        </Col>
                      </Row>
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

export default BalanceSheet;

