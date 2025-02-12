import React, { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../Header";
import MaterialReactTable from "material-react-table";
import "../admin/admin.css";
import { getUserInLocalStorage } from "../../context/getCurrentUser.js";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import SwipeLeftIcon from "@mui/icons-material/SwipeLeft";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { downloadFile } from "utils/postDetails/handleDataExportExcelGV";
const url =
  "https://wxutuelmzidfloowaugx.supabase.co/storage/v1/object/public/files/excel/DS-diem-tuan-cdsv-template.xlsx";
const QuanLyDiemCDSV = () => {
  const navigate = useNavigate();
  const { maLop, maHK } = useParams();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createUploadFileStudent, setCreateUploadFileStudent] = useState(false);

  const [tableData, setTableData] = useState([]);

  const [validationErrors, setValidationErrors] = useState({});
  const [err, setErr] = useState(null);

  const currentUser = getUserInLocalStorage();

  // get all class
  useEffect(() => {
    getAllClass();
  }, []);
  const getAllClass = async () => {
    try {
      const allClass = await axios.get(
        `http://localhost:8800/api/point_citizen/${maLop}/${maHK}`,
        {
          withCredentials: true,
        }
      );
      console.log("allClass.data: ", allClass.data);
      setTableData(allClass.data);
      // console.log("call lai khong");
    } catch (error) {
      console.log(error.response.data);
    }
  };

  // console.log(semesterData);
  // console.log(tableData);
  const handleCreateNewRow = async (values) => {
    // console.log(values);
    // console.log(maLop);

    try {
      await axios.post(
        `http://localhost:8800/api/point_citizen/${maHK}`,
        values,
        {
          withCredentials: true,
        }
      );
      tableData.push(values);
      setTableData([...tableData]);
      getAllClass();
      // window.location.href = `http://localhost:3000/quanlylopchunhiem/uploadfilecdsv/${maLop}/${maHK}`;
    } catch (error) {
      setErr(error.response.data);
    }
  };

  const handleSaveRowEdits = async ({ exitEditingMode, row, values }) => {
    if (!Object.keys(validationErrors).length) {
      tableData[row.index] = values;
      // console.log(values);
      axios.put(`http://localhost:8800/api/point_citizen/${maHK}`, values, {
        withCredentials: true,
      });
      //send/receive api updates here, then refetch or update local table data for re-render
      setTableData([...tableData]);
      exitEditingMode(); //required to exit editing mode and close modal
    }
  };

  const handleCancelRowEdits = () => {
    setValidationErrors({});
  };

  const handleDeleteRow = useCallback(
    async (row) => {
      if (
        !window.confirm(
          `Are you sure you want to delete ${row.getValue("name")}`
        )
      ) {
        return;
      }
      // console.log(row);
      //send api delete request here, then refetch or update local table data for re-render
      await axios.delete(
        `http://localhost:8800/api/point_citizen/${row.original.maSv}/${maHK}`,
        {
          withCredentials: true,
        }
      );
      tableData.splice(row.index, 1);
      setTableData([...tableData]);
    },
    [tableData, maHK]
  );

  const getCommonEditTextFieldProps = useCallback(
    (cell) => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event) => {
          const isValid =
            cell.column.id === "email"
              ? validateEmail(event.target.value)
              : cell.column.id === "age"
              ? validateAge(+event.target.value)
              : validateRequired(event.target.value);
          if (!isValid) {
            //set validation error for cell if invalid
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is required`,
            });
          } else {
            //remove validation error for cell if valid
            delete validationErrors[cell.id];
            setValidationErrors({
              ...validationErrors,
            });
          }
        },
      };
    },
    [validationErrors]
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "maSv",
        header: "Ma Sinh Vien",
        enableColumnOrdering: false,
        enableEditing: false, //disable editing on this column
        enableSorting: false,
        size: 80,
      },
      {
        accessorKey: "name",
        header: "Họ Và Tên",
        size: 140,
        enableEditing: false,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: "point",
        header: "Điểm Tuần CDSV",
        size: 140,
      },
    ],
    [getCommonEditTextFieldProps, tableData]
  );

  return (
    <Box m="1.5rem 2.5rem">
      <Header
        title={currentUser.name}
        subtitle={`Danh sách Diem CDSV Lop: ${maLop} ---- HK: ${maHK}`}
      />
      <Box mt="40px">
        <MaterialReactTable
          displayColumnDefOptions={{
            "mrt-row-actions": {
              muiTableHeadCellProps: {
                align: "center",
              },
              size: 120,
            },
          }}
          columns={columns}
          data={tableData}
          editingMode="modal" //default
          enableColumnOrdering
          enableEditing
          onEditingRowSave={handleSaveRowEdits}
          onEditingRowCancel={handleCancelRowEdits}
          renderRowActions={({ row, table }) => (
            <Box sx={{ display: "flex", gap: "1rem" }}>
              <Tooltip arrow placement="left" title="Edit">
                <IconButton onClick={() => table.setEditingRow(row)}>
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip arrow placement="right" title="Delete">
                <IconButton color="error" onClick={() => handleDeleteRow(row)}>
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          renderTopToolbarCustomActions={() => (
            <>
              <Button
                color="secondary"
                onClick={() => navigate(`/quanlylopchunhiem/${maLop}`)}
                variant="contained"
              >
                <SwipeLeftIcon />
              </Button>
              <Button
                color="secondary"
                onClick={() => setCreateModalOpen(true)}
                variant="contained"
              >
                Thêm Mới
              </Button>

              <Button
                color="secondary"
                onClick={() => setCreateUploadFileStudent(true)}
                variant="contained"
              >
                Upload file Diem CDSV
              </Button>
            </>
          )}
        />

        <CreateNewAccountModal
          err={err}
          columns={columns}
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateNewRow}
          getAllClass={getAllClass}
        />

        <CreateUploadFileSV
          err={err}
          open={createUploadFileStudent}
          onClose={() => setCreateUploadFileStudent(false)}
          maLop={maLop}
          maHK={maHK}
          getAllClass={getAllClass}
        />
      </Box>
    </Box>
  );
};

export const CreateNewAccountModal = ({
  err,
  open,
  onClose,
  onSubmit,
  getAllClass,
}) => {
  const [values, setValues] = useState({
    maSv: "",
    point: "",
  });

  const handleChange = (e) => {
    setValues((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  // console.log(values);

  // console.log(values);
  const handleSubmit = () => {
    //put your validation logic here
    onSubmit(values);
    onClose();
  };

  return (
    <Dialog open={open}>
      <DialogTitle textAlign="center">Thêm Mới</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: "100%",
              minWidth: { xs: "300px", sm: "360px", md: "400px" },
              gap: "1.5rem",
            }}
          >
            <TextField
              label="Ma SV"
              name="maSv"
              onChange={handleChange}
              required
            />

            <TextField
              label="Diem Tuan CDSV"
              name="point"
              onChange={handleChange}
              type="number"
              required
            />
          </Stack>
        </form>
        {err && err}
      </DialogContent>
      <DialogActions sx={{ p: "1.25rem" }}>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button color="secondary" onClick={handleSubmit} variant="contained">
          Thêm Mới
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const CreateUploadFileSV = ({
  err,
  open,
  onClose,
  maLop,
  maHK,
  getAllClass,
}) => {
  const [file, setFile] = useState(null);

  // console.log(maLop);
  function handleFileUpload(event) {
    setFile(event.target.files[0]);
  }
  // console.log(file);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("file", file);
    // console.log(formData);
    try {
      await axios.post(
        `http://localhost:8800/api/excel/students/diemtuancdsv/${maLop}/${maHK}`,
        formData,
        {
          withCredentials: true,
        }
      );
      await getAllClass();
      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Dialog open={open}>
      <DialogTitle textAlign="center">Upload file Diem Tuan CDSV</DialogTitle>
      <DialogContent>
        <Button
          variant="text"
          color="secondary"
          onClick={() =>
            downloadFile(url, "File template DS Diem Tuan CDSV.xlsx")
          }
        >
          Tải File Template
        </Button>
        <form onSubmit={handleSubmit}>
          <TextField type="file" onChange={handleFileUpload} />
          <Button type="submit">Upload</Button>
        </form>
        {err && err}
      </DialogContent>
      <DialogActions sx={{ p: "1.25rem" }}>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const validateRequired = (value) => !!value.length;
const validateEmail = (email) =>
  !!email.length &&
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
const validateAge = (age) => age >= 18 && age <= 50;

export default QuanLyDiemCDSV;
