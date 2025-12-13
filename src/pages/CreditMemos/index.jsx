import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Spinners from "../../components/Common/Spinner";
import TableContainer from "../../components/Common/TableContainer";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Modal,
  ModalHeader,
  ModalBody,
  Button,
  Table,
} from "reactstrap";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const CreditMemos = () => {
  document.title = "Credit Memos";
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [creditMemos, setCreditMemos] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [people, setPeople] = useState([]);
  const [units, setUnits] = useState([]);
  const [viewingCreditMemo, setViewingCreditMemo] = useState(null);
  const [showCreditMemoDetailsModal, setShowCreditMemoDetailsModal] = useState(false);

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

  const fetchPeople = async () => {
    try {
      let url = "people";
      if (buildingId) {
        url = `buildings/${buildingId}/people`;
      }
      const { data } = await axiosInstance.get(url);
      setPeople(data || []);
    } catch (error) {
      console.log("Error fetching people", error);
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

  const fetchCreditMemos = async () => {
    try {
      setLoading(true);
      let url = "credit-memos";
      if (buildingId) {
        url = `buildings/${buildingId}/credit-memos`;
      } else {
        url = `credit-memos?building_id=${buildingId || ""}`;
      }
      const { data } = await axiosInstance.get(url);
      setCreditMemos(data || []);
    } catch (error) {
      console.log("Error fetching credit memos", error);
      toast.error("Failed to fetch credit memos");
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditMemoDetails = async (creditMemoId) => {
    try {
      setLoading(true);
      let url = `credit-memos/${creditMemoId}`;
      if (buildingId) {
        url = `buildings/${buildingId}/credit-memos/${creditMemoId}`;
      }
      const { data: creditMemoResponse } = await axiosInstance.get(url);
      setViewingCreditMemo(creditMemoResponse);
      setShowCreditMemoDetailsModal(true);
    } catch (error) {
      console.log("Error fetching credit memo details", error);
      toast.error("Failed to fetch credit memo details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchPeople();
    fetchUnits();
    fetchCreditMemos();
  }, [buildingId]);

  const getAccountName = (accountId) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? account.account_name : "N/A";
  };

  const getPeopleName = (peopleId) => {
    const person = people.find((p) => p.id === peopleId);
    return person ? person.name : "N/A";
  };

  const getUnitName = (unitId) => {
    const unit = units.find((u) => u.id === unitId);
    return unit ? unit.name : "N/A";
  };

  const columns = useMemo(
    () => [
      {
        header: "Date",
        accessorKey: "date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.date ? moment(cell.row.original.date).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "People",
        accessorKey: "people_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{getPeopleName(cell.row.original.people_id)}</>;
        },
      },
      {
        header: "Unit",
        accessorKey: "unit_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{getUnitName(cell.row.original.unit_id)}</>;
        },
      },
      {
        header: "Amount",
        accessorKey: "amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{parseFloat(cell.row.original.amount || 0).toFixed(2)}</>;
        },
      },
      {
        header: "Deposit To",
        accessorKey: "deposit_to",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{getAccountName(cell.row.original.deposit_to)}</>;
        },
      },
      {
        header: "Liability Account",
        accessorKey: "liability_account",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{getAccountName(cell.row.original.liability_account)}</>;
        },
      },
      {
        header: "Description",
        accessorKey: "description",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Actions",
        accessorKey: "actions",
        enableColumnFilter: false,
        enableSorting: false,
        cell: (cell) => {
          return (
            <>
              <Button
                color="info"
                size="sm"
                className="me-2"
                onClick={() => fetchCreditMemoDetails(cell.row.original.id)}
              >
                View
              </Button>
              <Button
                color="primary"
                size="sm"
                onClick={() => navigate(`/building/${buildingId}/credit-memos/${cell.row.original.id}/edit`)}
              >
                Edit
              </Button>
            </>
          );
        },
      },
    ],
    [accounts, people, units, buildingId, navigate]
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Transactions" breadcrumbItem="Credit Memos" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="card-title mb-0">Credit Memos</h4>
                    <Button
                      color="success"
                      onClick={() => navigate(`/building/${buildingId}/credit-memos/create`)}
                    >
                      <i className="mdi mdi-plus me-1"></i> Create Credit Memo
                    </Button>
                  </div>
                  {isLoading ? (
                    <Spinners setLoading={setLoading} />
                  ) : (
                    <TableContainer
                      columns={columns}
                      data={creditMemos}
                      isGlobalFilter={true}
                      isPagination={true}
                      isShowingPageSize={true}
                      paginationDiv="col-sm-12 col-md-7"
                      pagination="pagination justify-content-end pagination-rounded"
                    />
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Credit Memo Details Modal */}
      <Modal
        isOpen={showCreditMemoDetailsModal}
        toggle={() => setShowCreditMemoDetailsModal(false)}
        size="lg"
      >
        <ModalHeader toggle={() => setShowCreditMemoDetailsModal(false)}>
          Credit Memo Details
        </ModalHeader>
        <ModalBody>
          {viewingCreditMemo && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Date:</strong> {moment(viewingCreditMemo.credit_memo.date).format("YYYY-MM-DD")}
                </Col>
                <Col md={6}>
                  <strong>Amount:</strong> {parseFloat(viewingCreditMemo.credit_memo.amount || 0).toFixed(2)}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>People:</strong> {getPeopleName(viewingCreditMemo.credit_memo.people_id)}
                </Col>
                <Col md={6}>
                  <strong>Unit:</strong> {getUnitName(viewingCreditMemo.credit_memo.unit_id)}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Deposit To:</strong> {getAccountName(viewingCreditMemo.credit_memo.deposit_to)}
                </Col>
                <Col md={6}>
                  <strong>Liability Account:</strong> {getAccountName(viewingCreditMemo.credit_memo.liability_account)}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <strong>Description:</strong> {viewingCreditMemo.credit_memo.description}
                </Col>
              </Row>

              {/* Double-Entry Accounting Section */}
              <hr />
              <h5 className="mb-3">Double-Entry Accounting</h5>
              
              {/* Active Splits */}
              <h6 className="mb-2">Active Splits</h6>
              <div className="table-responsive mb-4">
                <Table bordered striped>
                  <thead className="table-light">
                    <tr>
                      <th>Account</th>
                      <th>People</th>
                      <th className="text-end">Debit</th>
                      <th className="text-end">Credit</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingCreditMemo.splits
                      .filter((split) => split.status === "1")
                      .map((split, index) => (
                        <tr key={index}>
                          <td>{getAccountName(split.account_id)}</td>
                          <td>{split.people_id ? getPeopleName(split.people_id) : "N/A"}</td>
                          <td className="text-end">
                            {split.debit ? parseFloat(split.debit).toFixed(2) : "-"}
                          </td>
                          <td className="text-end">
                            {split.credit ? parseFloat(split.credit).toFixed(2) : "-"}
                          </td>
                          <td>Active</td>
                        </tr>
                      ))}
                    {/* Total Row for Active Splits */}
                    <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                      <td colSpan="2" className="text-end">TOTAL</td>
                      <td className="text-end">
                        {viewingCreditMemo.splits
                          .filter((split) => split.status === "1")
                          .reduce((sum, split) => sum + (parseFloat(split.debit || 0)), 0)
                          .toFixed(2)}
                      </td>
                      <td className="text-end">
                        {viewingCreditMemo.splits
                          .filter((split) => split.status === "1")
                          .reduce((sum, split) => sum + (parseFloat(split.credit || 0)), 0)
                          .toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              {/* Inactive Splits (Previous) */}
              {viewingCreditMemo.splits.filter((split) => split.status === "0" || split.status === 0).length > 0 && (
                <>
                  <h6 className="mb-2">Previous Splits (Inactive)</h6>
                  <div className="table-responsive">
                    <Table bordered striped>
                      <thead className="table-light">
                        <tr>
                          <th>Account</th>
                          <th>People</th>
                          <th className="text-end">Debit</th>
                          <th className="text-end">Credit</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingCreditMemo.splits
                          .filter((split) => split.status === "0" || split.status === 0)
                          .map((split, index) => (
                            <tr key={index} style={{ opacity: 0.6 }}>
                              <td>{getAccountName(split.account_id)}</td>
                              <td>{split.people_id ? getPeopleName(split.people_id) : "N/A"}</td>
                              <td className="text-end">
                                {split.debit ? parseFloat(split.debit).toFixed(2) : "-"}
                              </td>
                              <td className="text-end">
                                {split.credit ? parseFloat(split.credit).toFixed(2) : "-"}
                              </td>
                              <td>Inactive</td>
                            </tr>
                          ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </>
          )}
        </ModalBody>
      </Modal>

      <ToastContainer />
    </React.Fragment>
  );
};

export default CreditMemos;

