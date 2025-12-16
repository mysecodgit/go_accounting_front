import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Spinners from "../../components/Common/Spinner";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Label,
  FormFeedback,
  Input,
  Form,
  Button,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const CreateReading = () => {
  document.title = "Create Reading";
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [allLeases, setAllLeases] = useState([]);
  const [filteredLeases, setFilteredLeases] = useState([]);

  // Get last day of previous month
  const getLastDayOfPreviousMonth = () => {
    return moment().subtract(1, "month").endOf("month").format("YYYY-MM-DD");
  };

  // Get previous month name
  const getPreviousMonthName = () => {
    return moment().subtract(1, "month").format("MMMM");
  };

  // Get current year
  const getCurrentYear = () => {
    return moment().format("YYYY");
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      item_id: "",
      unit_id: "",
      lease_id: "",
      reading_month: getPreviousMonthName(),
      reading_year: getCurrentYear(),
      reading_date: getLastDayOfPreviousMonth(),
      previous_value: "",
      current_value: "",
      unit_price: "",
      total_amount: "",
      notes: "",
      status: "1",
    },
    validationSchema: Yup.object({
      item_id: Yup.number().required("Item is required").min(1, "Please select an item"),
      unit_id: Yup.number().required("Unit is required").min(1, "Please select a unit"),
      lease_id: Yup.number().nullable(),
      reading_month: Yup.string().max(10, "Reading month must be 10 characters or less"),
      reading_year: Yup.string().max(5, "Reading year must be 5 characters or less"),
      reading_date: Yup.date().required("Reading date is required"),
      previous_value: Yup.number().nullable().min(0, "Previous value cannot be negative"),
      current_value: Yup.number().nullable().min(0, "Current value cannot be negative"),
      unit_price: Yup.number().nullable().min(0, "Unit price cannot be negative"),
      total_amount: Yup.number().nullable().min(0, "Total amount cannot be negative"),
      notes: Yup.string().nullable(),
      status: Yup.string().required("Status is required"),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const payload = {
          item_id: parseInt(values.item_id),
          unit_id: parseInt(values.unit_id),
          lease_id: values.lease_id ? parseInt(values.lease_id) : null,
          reading_month: values.reading_month || null,
          reading_year: values.reading_year || null,
          reading_date: values.reading_date,
          previous_value: values.previous_value !== "" && values.previous_value !== null && values.previous_value !== undefined ? parseFloat(values.previous_value) : (values.previous_value === "0" || values.previous_value === 0 ? 0 : null),
          current_value: values.current_value ? parseFloat(values.current_value) : null,
          unit_price: values.unit_price ? parseFloat(values.unit_price) : null,
          total_amount: values.total_amount ? parseFloat(values.total_amount) : null,
          notes: values.notes || null,
          status: values.status,
        };
        await axiosInstance.post(`buildings/${buildingId}/readings`, payload);
        toast.success("Reading created successfully");
        navigate(`/building/${buildingId}/readings`);
      } catch (error) {
        const errorMsg = error.response?.data?.error || "Failed to create reading";
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
  });

  const fetchItems = async () => {
    try {
      const { data } = await axiosInstance.get(`buildings/${buildingId}/items`);
      setItems(data || []);
    } catch (error) {
      console.log("Error fetching items", error);
      toast.error("Failed to fetch items");
    }
  };

  const fetchUnits = async () => {
    try {
      const { data } = await axiosInstance.get(`buildings/${buildingId}/units`);
      setUnits(data || []);
    } catch (error) {
      console.log("Error fetching units", error);
      toast.error("Failed to fetch units");
    }
  };

  const fetchLeases = async () => {
    try {
      const { data } = await axiosInstance.get(`buildings/${buildingId}/leases`);
      setAllLeases(data || []);
      setFilteredLeases([]); // Initially empty until unit is selected
    } catch (error) {
      console.log("Error fetching leases", error);
      toast.error("Failed to fetch leases");
    }
  };

  // Fetch leases for a specific unit
  const fetchLeasesByUnit = async (unitId) => {
    if (!unitId) {
      setFilteredLeases([]);
      validation.setFieldValue("lease_id", "");
      return;
    }

    try {
      const { data } = await axiosInstance.get(`buildings/${buildingId}/leases/unit/${unitId}`);
      setFilteredLeases(data || []);
      // Clear lease_id if the selected lease is not in the filtered list
      if (validation.values.lease_id) {
        const selectedLeaseId = parseInt(validation.values.lease_id);
        const leaseExists = (data || []).some((lease) => lease.lease?.id === selectedLeaseId);
        if (!leaseExists) {
          validation.setFieldValue("lease_id", "");
        }
      }
    } catch (error) {
      console.log("Error fetching leases by unit", error);
      setFilteredLeases([]);
      validation.setFieldValue("lease_id", "");
    }
  };

  // Fetch latest reading when item or unit changes
  const fetchLatestReading = async (itemId, unitId) => {
    if (!itemId || !unitId) {
      validation.setFieldValue("previous_value", "");
      return;
    }

    try {
      const { data } = await axiosInstance.get(`buildings/${buildingId}/readings/latest`, {
        params: {
          item_id: itemId,
          unit_id: unitId,
        },
      });

      if (data.reading && data.reading.current_value !== null && data.reading.current_value !== undefined) {
        const currentValue = data.reading.current_value;
        validation.setFieldValue("previous_value", currentValue === 0 ? "0" : currentValue.toString());
      } else {
        validation.setFieldValue("previous_value", "");
      }
    } catch (error) {
      console.log("Error fetching latest reading", error);
      validation.setFieldValue("previous_value", "");
    }
  };

  // Fetch leases when unit_id changes
  useEffect(() => {
    const unitId = validation.values.unit_id ? parseInt(validation.values.unit_id) : null;
    if (unitId) {
      fetchLeasesByUnit(unitId);
    } else {
      setFilteredLeases([]);
      validation.setFieldValue("lease_id", "");
    }
  }, [validation.values.unit_id]);

  // Fetch latest reading when item or unit changes
  useEffect(() => {
    const itemId = validation.values.item_id;
    const unitId = validation.values.unit_id;
    if (itemId && unitId) {
      fetchLatestReading(itemId, unitId);
    } else {
      validation.setFieldValue("previous_value", "");
    }
  }, [validation.values.item_id, validation.values.unit_id]);

  useEffect(() => {
    fetchItems();
    fetchUnits();
    fetchLeases();
  }, [buildingId]);

  // Calculate total amount when current_value or unit_price changes
  useEffect(() => {
    const currentValue = parseFloat(validation.values.current_value) || 0;
    const previousValue = parseFloat(validation.values.previous_value) || 0;
    const unitPrice = parseFloat(validation.values.unit_price) || 0;
    const consumption = currentValue - previousValue;
    const total = consumption * unitPrice;
    
    if (total > 0 || (currentValue > 0 && unitPrice > 0)) {
      validation.setFieldValue("total_amount", total.toFixed(2));
    }
  }, [validation.values.current_value, validation.values.previous_value, validation.values.unit_price]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Create Reading" breadcrumbItem="Create Reading" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <Form
                    onSubmit={(e) => {
                      e.preventDefault();
                      validation.handleSubmit();
                      return false;
                    }}
                  >
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Item <span className="text-danger">*</span></Label>
                          <Input
                            name="item_id"
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.item_id || ""}
                            invalid={validation.touched.item_id && validation.errors.item_id ? true : false}
                          >
                            <option value="">Select Item</option>
                            {items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                          {validation.touched.item_id && validation.errors.item_id ? (
                            <FormFeedback type="invalid">{validation.errors.item_id}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Unit <span className="text-danger">*</span></Label>
                          <Input
                            name="unit_id"
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.unit_id || ""}
                            invalid={validation.touched.unit_id && validation.errors.unit_id ? true : false}
                          >
                            <option value="">Select Unit</option>
                            {units.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.name}
                              </option>
                            ))}
                          </Input>
                          {validation.touched.unit_id && validation.errors.unit_id ? (
                            <FormFeedback type="invalid">{validation.errors.unit_id}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Lease</Label>
                          <Input
                            name="lease_id"
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.lease_id || ""}
                            invalid={validation.touched.lease_id && validation.errors.lease_id ? true : false}
                          >
                            <option value="">Select Lease (Optional)</option>
                            {filteredLeases.map((leaseItem) => {
                              const lease = leaseItem.lease || leaseItem;
                              const peopleName = leaseItem.people?.name || "";
                              return (
                                <option key={lease.id} value={lease.id}>
                                  {peopleName ? `${peopleName} - ` : ""}Lease #{lease.id}{lease.lease_terms ? ` - ${lease.lease_terms}` : ""}
                                </option>
                              );
                            })}
                          </Input>
                          {validation.touched.lease_id && validation.errors.lease_id ? (
                            <FormFeedback type="invalid">{validation.errors.lease_id}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Reading Date <span className="text-danger">*</span></Label>
                          <Input
                            name="reading_date"
                            type="date"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.reading_date || ""}
                            invalid={validation.touched.reading_date && validation.errors.reading_date ? true : false}
                          />
                          {validation.touched.reading_date && validation.errors.reading_date ? (
                            <FormFeedback type="invalid">{validation.errors.reading_date}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Reading Month</Label>
                          <Input
                            name="reading_month"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.reading_month || ""}
                            placeholder="e.g., January"
                            invalid={validation.touched.reading_month && validation.errors.reading_month ? true : false}
                          />
                          {validation.touched.reading_month && validation.errors.reading_month ? (
                            <FormFeedback type="invalid">{validation.errors.reading_month}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Reading Year</Label>
                          <Input
                            name="reading_year"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.reading_year || ""}
                            placeholder="e.g., 2024"
                            invalid={validation.touched.reading_year && validation.errors.reading_year ? true : false}
                          />
                          {validation.touched.reading_year && validation.errors.reading_year ? (
                            <FormFeedback type="invalid">{validation.errors.reading_year}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Previous Value</Label>
                          <Input
                            name="previous_value"
                            type="number"
                            step="0.001"
                            min="0"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.previous_value !== undefined && validation.values.previous_value !== null && validation.values.previous_value !== "" ? validation.values.previous_value : ""}
                            placeholder="0.000"
                            invalid={validation.touched.previous_value && validation.errors.previous_value ? true : false}
                          />
                          {validation.touched.previous_value && validation.errors.previous_value ? (
                            <FormFeedback type="invalid">{validation.errors.previous_value}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Current Value</Label>
                          <Input
                            name="current_value"
                            type="number"
                            step="0.001"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.current_value || ""}
                            placeholder="0.000"
                            invalid={validation.touched.current_value && validation.errors.current_value ? true : false}
                          />
                          {validation.touched.current_value && validation.errors.current_value ? (
                            <FormFeedback type="invalid">{validation.errors.current_value}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Unit Price</Label>
                          <Input
                            name="unit_price"
                            type="number"
                            step="0.01"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.unit_price || ""}
                            placeholder="0.00"
                            invalid={validation.touched.unit_price && validation.errors.unit_price ? true : false}
                          />
                          {validation.touched.unit_price && validation.errors.unit_price ? (
                            <FormFeedback type="invalid">{validation.errors.unit_price}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Total Amount</Label>
                          <Input
                            name="total_amount"
                            type="number"
                            step="0.01"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.total_amount || ""}
                            placeholder="0.00"
                            readOnly
                            style={{ backgroundColor: '#e9ecef' }}
                            invalid={validation.touched.total_amount && validation.errors.total_amount ? true : false}
                          />
                          {validation.touched.total_amount && validation.errors.total_amount ? (
                            <FormFeedback type="invalid">{validation.errors.total_amount}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={12}>
                        <div className="mb-3">
                          <Label>Notes</Label>
                          <Input
                            name="notes"
                            type="textarea"
                            rows="3"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.notes || ""}
                            placeholder="Additional notes..."
                            invalid={validation.touched.notes && validation.errors.notes ? true : false}
                          />
                          {validation.touched.notes && validation.errors.notes ? (
                            <FormFeedback type="invalid">{validation.errors.notes}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Status <span className="text-danger">*</span></Label>
                          <Input
                            name="status"
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.status || "1"}
                            invalid={validation.touched.status && validation.errors.status ? true : false}
                          >
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                          </Input>
                          {validation.touched.status && validation.errors.status ? (
                            <FormFeedback type="invalid">{validation.errors.status}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>
                    <div className="d-flex justify-content-end gap-2">
                      <Button
                        type="button"
                        color="secondary"
                        onClick={() => navigate(`/building/${buildingId}/readings`)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" color="primary" disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create Reading"}
                      </Button>
                    </div>
                  </Form>
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

export default CreateReading;

